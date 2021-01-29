package barefoot.nlserver.common;

//TODO:
// Handle communication
// Make initial instruction mockup
// Save game to disk, ask server for active games on startup


import barefoot.nlserver.Game;
import barefoot.nlserver.GameTurn;
import barefoot.nlserver.NLServer;
import barefoot.nlserver.User;
import barefoot.nlserver.common.error.*;
import com.uploadcare.api.Client;
import com.uploadcare.upload.FileUploader;
import com.uploadcare.upload.UploadFailureException;
import com.uploadcare.upload.Uploader;
import org.nlogo.headless.HeadlessWorkspace;

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;
import java.util.Arrays;
import java.util.concurrent.ConcurrentHashMap;

public class ServerHelper {

    public static final int MAX_APPLICATIONS = 100;
    public static ConcurrentHashMap<String, ConcurrentHashMap<String, Game>> runningApplicationGroup = new ConcurrentHashMap<String, ConcurrentHashMap<String, Game>>();
    public static ConcurrentHashMap<String, ConcurrentHashMap<String, String>> applicationgroupSettings = new ConcurrentHashMap<>();

    public static void setUpNewGameGroup(String passWord, ConcurrentHashMap<String, String> settings) {
        ConcurrentHashMap tmp = runningApplicationGroup.get(passWord);
        if (tmp != null)
            throw new InvalidGameGroupException("A Game group with ID does already exist (ID:" + passWord + ")");
        synchronized (runningApplicationGroup) {
            runningApplicationGroup.put(passWord, new ConcurrentHashMap<>());
        }
        applicationgroupSettings.put(passWord, settings);
        ServerPool.getEnlargePool(passWord);
    }

    /*
    public static void resetServer() {
        for (String passWord : runningApplicationGroup.keySet()) {
            HashMap<String, Game> runningApplications = runningApplicationGroup.get(passWord);
            for (Game gamePair : runningApplications.values()) {

                //gamePair.workspace.dispose();
                ServerPool.returnInstance(gamePair.workspace, passWord);

            }
            runningApplications.clear();
        }
        IdHelper.reset();
        runningApplicationGroup = new HashMap<>();
    }
*/
    /*
        private static int getActiveRunningApplications() {
            return runningApplications.size();
        }
    */
    public static void startNewGame(Game game, int rounds, String passWord) throws NoGameSpotOpenException {
        ConcurrentHashMap runningApplications = runningApplicationGroup.get(passWord);
        if (runningApplications != null) {
            if (runningApplications.size() >= MAX_APPLICATIONS) {
                NoGameSpotOpenException err = new NoGameSpotOpenException("All gamespots on the server are filled (MAX:" + MAX_APPLICATIONS + ")");
                throw err;
            }
            synchronized (runningApplicationGroup) {
                runningApplications.put(game.getId().toUpperCase(), game);
            }
        } else
            throw new InvalidGameGroupException("Game group with ID does not exist (ID:" + passWord + ")");
    }

    //If gameId == "LookingForGroup" -> find a open spot,
    //If it cannot be found, throw exception
    public static Game addPlayerToGame(String playerId, String gameId, String passWord) {
        ConcurrentHashMap<String, Game> runningApplications = runningApplicationGroup.get(passWord);
        if (runningApplications == null)
            throw new InvalidGameGroupException("Game group with ID does not exist (ID:" + passWord + ")");
        //look if already in a game
        String oldGameId = checkIfRegistred(playerId);
        if (oldGameId != null && !oldGameId.equalsIgnoreCase(gameId))
            throw new PlayerAlreadyActiveInAGameException("You are already active in game: " + oldGameId + ". You have to finish that game before you register for a new one.");
        synchronized (ServerHelper.runningApplicationGroup) {
            if (gameId.equalsIgnoreCase("LookingForGroup")) {
                for (Game game : runningApplications.values()) {
                    if (game.hasRoomForMoreHumanPlayers())
                        return game.addPlayer(playerId);
                }
                throw new NoGameSpotOpenException("No currently open games, create a new game");
            } else {
                //look if room in game with gameId
                Game game = runningApplications.get(gameId.toUpperCase());
                if (game == null)
                    throw new GameDoesNotExistException(gameId + " does not exist on the server.");
                return game.addPlayer(playerId);
            }
        }
    }

    //Nästa metod borde vara registera uttag. avancera spel om alla är klara
    //Sätt timer för deadline.
    public static Game registerYield(String playerID, int amount, String passWord) {
        //Get active game
        String gameId = checkIfRegistred(playerID);
        if (gameId == null)
            throw new PlayerNotInAnyGameException("You are not in any active game. You have to register to a game before you can interact with it.");
        //register amount
        ConcurrentHashMap<String, Game> runningApplications = runningApplicationGroup.get(passWord);
        runningApplications.get(gameId.toUpperCase()).registerYield(playerID, amount);
        return runningApplications.get(gameId.toUpperCase());
    }

    public static String checkIfRegistred(String playerid) {
        synchronized (ServerHelper.runningApplicationGroup) {
            for (ConcurrentHashMap<String, Game> runningApplications : runningApplicationGroup.values()) {
                for (Game gameData : runningApplications.values()) {
                    if (gameData != null)
                        if (Arrays.asList(gameData.getPlayers()).contains(new User(playerid, null, -1))) {
                            return gameData.getId();
                        }
                }
            }
        }
        return null;
    }

    public static Game getGameResult(String gameid) {
        Game gamePair = null;
        synchronized (ServerHelper.runningApplicationGroup) {
            ConcurrentHashMap<String, Game> runningApplications = null;
            for (ConcurrentHashMap<String, Game> apps : runningApplicationGroup.values()) {
                Game tmp = apps.get(gameid.toUpperCase());
                if (tmp != null) {
                    gamePair = tmp;
                    runningApplications = apps;
                    break;
                }
            }
            if (gamePair == null)
                throw new GameDoesNotExistException("Game with ID: " + gameid + " does not exists on this server.");
            //gamePair.createTotalExtractionGraph();
            gamePair.saveToFile();
            runningApplications.remove(gameid.toUpperCase());
            ServerPool.returnInstance(gamePair.workspace, gamePair.getGameGroupId());
        }
        return gamePair;

    }


    public static GameTurn checkIfTurnIsFinished(Game gamePair) {
        synchronized (gamePair.gameTurns[gamePair.getCurrentTurnIndex()]) {
            boolean gameAdvanced = gamePair.advanceToNextTurn();
            if (gameAdvanced) {
                return gamePair.gameTurns[gamePair.getCurrentTurnIndex()];
            } else if (gamePair.gameHasFinished) {
                gamePair.gameTurns[gamePair.getCurrentTurnIndex()].setStatus(201);
                return gamePair.gameTurns[gamePair.getCurrentTurnIndex()];
            }
            throw new GameTurnNotEndedYet("Not done yet, try again!!");
        }
    }

    public static URL uploadFile(String path) {
        //Client client = new Client("311da0ee7551d34bbc05","cac15a92609bfee96ce6", true, null);
        //ClassLoader classLoader = GameTurn.class.getClassLoader();
        //URL resource = classLoader.getResource("org/apache/http/message/BasicLineFormatter.class");
        //System.out.println(resource);

        Client client = Client.demoClient();
        java.io.File localFile = new java.io.File(path);
        Uploader uploader = new FileUploader(client, localFile);
        try {
            com.uploadcare.api.File uploadedFile = uploader.upload().save();
            return uploadedFile.getOriginalFileUrl().toURL();
        } catch (MalformedURLException | UploadFailureException ex) {
            ex.printStackTrace();
        }
        return null;
    }

    public static void SendMessageBackToMessenger(Game game, String action) {
        String urlParameters = "/" + action + "?gameId=" + game.getId();
        System.out.println(urlParameters);
        //possible actions is: "gameTurnEnded", "gameHasStarted"
        try {
            URL cpr = new URL("https://" + ServerHelper.applicationgroupSettings.get(game.getGameGroupId()).get("NODE_SERVER") + urlParameters);
            //URL cpr = new URL("https://www.google.se");
            System.out.println("cpr = " + cpr);
            URLConnection yc = cpr.openConnection();

            BufferedReader in = new BufferedReader(
                    new InputStreamReader(
                            yc.getInputStream()));
            String inputLine;

            while ((inputLine = in.readLine()) != null)
                System.out.println(inputLine);
            in.close();

        } catch (IOException ex) {
            ex.printStackTrace();
        }
    }

    public static Game registerChatMessage(String playerid, String passWord, String gameId, String message) {
        //Get active game
        String checkId = checkIfRegistred(playerid);
        if (!gameId.equalsIgnoreCase(checkId))
            throw new PlayerNotInAnyGameException("You are not in any active game. You have to register to a game before you can interact with it.");
        //register chat
        ConcurrentHashMap<String, Game> runningApplications = runningApplicationGroup.get(passWord);
        runningApplications.get(gameId.toUpperCase()).registerChatMessage(playerid, message);
        return runningApplications.get(gameId.toUpperCase());
    }

    public static Game updateGroupAndUserKnowledge(String playerid, String passWord, String gameId, double knowledge) {
        //Get active game
        String checkId = checkIfRegistred(playerid);
        if (!gameId.equalsIgnoreCase(checkId))
            throw new PlayerNotInAnyGameException("You are not in any active game. You have to register to a game before you can interact with it.");
        //connect to model and runUpdate
        ConcurrentHashMap<String, Game> runningApplications = runningApplicationGroup.get(passWord);
        runningApplications.get(gameId.toUpperCase()).updateGroupKnowledge(playerid, knowledge);
        return runningApplications.get(gameId.toUpperCase());
    }

    public static Game registerConfidence(String playerid, double assessment, String passWord) {
        //Get active game
        String gameId = checkIfRegistred(playerid);
        if (gameId == null)
            throw new PlayerNotInAnyGameException("You are not in any active game. You have to register to a game before you can interact with it.");
        //register amount
        ConcurrentHashMap<String, Game> runningApplications = runningApplicationGroup.get(passWord);
        runningApplications.get(gameId.toUpperCase()).registerConfidence(playerid, assessment);
        return runningApplications.get(gameId.toUpperCase());
    }
}
