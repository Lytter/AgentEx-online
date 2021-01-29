package barefoot.nlserver;

import barefoot.nlserver.common.ServerHelper;
import barefoot.nlserver.common.ServerPool;
import barefoot.nlserver.common.error.GameTurnNotEndedYet;
import barefoot.nlserver.common.error.NoGameSpotOpenException;
import barefoot.nlserver.common.error.PlayerAlreadyPostedThisTurn;
import barefoot.nlserver.common.error.PlayerNotInAnyGameException;
import org.nlogo.api.Workspace;
import org.nlogo.headless.HeadlessWorkspace;
import org.springframework.web.bind.annotation.*;


import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@RestController
public class GameController {
    private static final String template = "Hello, %s!";
    private static final String errTemplate = "Error, %s!";
    private final AtomicLong counter = new AtomicLong();
    public static final int MAX_TURNS = 14;

    public class EmptyResponse {
        private String result = "OK";

        public String getResult() {
            return result;
        }

        public void setResult(String result) {
            this.result = result;
        }
    }
    /*
    @RequestMapping("/unregistergamegroup")
    public EmptyResponse unregistergamegroup(@RequestParam(value="passWord") String passWord) {
        try {
            HashMap<String, Game> apps = ServerHelper.runningApplicationGroup.get(passWord);
            for (String key : apps.keySet()) {
                ServerHelper.getGameResult(key);
                apps.remove(key);
            }
            ServerHelper.runningApplicationGroup.remove(passWord);
            ServerHelper.applicationgroupSettings.remove(passWord);
        } catch(Exception e) {
            e.printStackTrace();
            EmptyResponse res = new EmptyResponse();
            res.setResult(e.getMessage());
        }
        return new EmptyResponse();
    }
    */
    @RequestMapping("/newgamegroup")
    public EmptyResponse setUpNewGameGroup(@RequestParam(value="passWord") String passWord, @RequestParam(value="node_server") String node_server
            , @RequestParam(value="path_to_result") String path_to_result
            , @RequestParam(value="netlogo_model") String netlogo_model
            , @RequestParam(value="netlogo_world") String netlogo_world
            , @RequestParam(value="survey") String survey
            , @RequestParam(value="valid_until") String valid_until
            , @RequestParam(value="max_humans") String max_humans
            , @RequestParam(value="grace") String grace) {
        //Build hashmap of settings
        ConcurrentHashMap<String, String> settings = new ConcurrentHashMap<>();
        settings.put("NODE_SERVER", node_server);
        settings.put("PATH_TO_GAME_RESULT", path_to_result);
        settings.put("PATH_TO_NETLOGO_MODEL", netlogo_model);
        settings.put("PATH_TO_NETLOGO_WORLD", netlogo_world);
        settings.put("URL_TO_SURVEY", survey); //Not used by Java-server
        settings.put("GAMEGROUP_VALID_UNTIL", valid_until); //Not used by Java-server
        settings.put("MAX_HUMANS", max_humans);
        settings.put("GRACE", grace);
        ServerHelper.setUpNewGameGroup(passWord, settings);
        return new EmptyResponse();
    }

    @RequestMapping("/startgame")
    public Game startGame(@RequestParam(value="passWord") String passWord, @RequestParam(value="rounds", defaultValue="miss") String rounds) {
        int x;
        try {
            x = Integer.valueOf(rounds);
        } catch (NumberFormatException e) {
            x = MAX_TURNS;
        }
        UUID id = UUID.randomUUID();
        Game game = new Game(id, passWord,
                Integer.valueOf(ServerHelper.applicationgroupSettings.get(passWord).get("MAX_HUMANS")),
                Integer.valueOf(ServerHelper.applicationgroupSettings.get(passWord).get("GRACE")));
        System.out.println("GAME RUNNING");
        try {
            ServerHelper.startNewGame(game, x, passWord);
            System.out.println("GAME STARTED");
            return game;
        }catch(NoGameSpotOpenException noAvailableGameSpot) {
            ServerPool.returnInstance(game.workspace, passWord);
            throw  noAvailableGameSpot;
        }
    }

    @RequestMapping("/addplayer")
    public Game addPlayer(@RequestParam(value="passWord") String passWord, @RequestParam(value="playerid") String playerid, @RequestParam(value="gameid") String gameid) {
        return ServerHelper.addPlayerToGame(playerid, gameid, passWord);
    }

    @RequestMapping("/registerYield")
    public Game registerYield(@RequestParam(value="passWord") String passWord, @RequestParam(value="playerid") String playerid, @RequestParam(value="yield") int amount) {
        return ServerHelper.registerYield(playerid, amount, passWord);
    }

    @RequestMapping("/registerConfidence")
    public Game registerConfidence(@RequestParam(value="passWord") String passWord, @RequestParam(value="playerid") String playerid, @RequestParam(value="assessment") double assessment) {
        return ServerHelper.registerConfidence(playerid, assessment, passWord);
    }

    @RequestMapping("/registerChatMessage")
    public Game registerChatMessage(@RequestParam(value="passWord") String passWord, @RequestParam(value="playerid") String playerid, @RequestParam(value="gameId") String gameId, @RequestParam(value="chatmessage") String message) {
        return ServerHelper.registerChatMessage(playerid, passWord, gameId, message);
    }

    @RequestMapping("/updateGroupAndUserKnowledge")
    public Game updateGroupAndUserKnowledge(@RequestParam(value="passWord") String passWord, @RequestParam(value="playerid") String playerid, @RequestParam(value="gameId") String gameId, @RequestParam(value="knowledge") Double knowledge) {
        return ServerHelper.updateGroupAndUserKnowledge(playerid, passWord, gameId, knowledge);
    }

    @RequestMapping("/checkIfTurnIsFinnished")
    public GameTurn isTurnFinished(@RequestParam(value="gameid") String gameid) {
        return null;
        //return ServerHelper.checkIfTurnIsFinnished(gameid);
    }

    @RequestMapping("/getGameResult")
    public Game getGameResult(@RequestParam(value="gameid") String gameid) {
        return ServerHelper.getGameResult(gameid);
    }
/*
    @RequestMapping("/reset")
    public void reset() {
        ServerHelper.resetServer();
    }
*/
    @RequestMapping("/getLastGameTurn")
    public GameTurn getLastGameTurn(@RequestParam(value="passWord") String passWord, @RequestParam(value="playerid") String playerid) {
        String gameid = ServerHelper.checkIfRegistred(playerid);
        if (gameid == null)
            throw new PlayerNotInAnyGameException("You are not registred as a player in any game I manage!");
        Game game = ServerHelper.runningApplicationGroup.get(passWord).get(gameid.toUpperCase());
        int currentTurn = game.getCurrentTurnIndex();
        GameTurn gameTurn;
        if (currentTurn > 0)
            gameTurn = game.gameTurns[currentTurn-1];
        else
            throw new GameTurnNotEndedYet("It is still the first turn of the game.\nYou cannot check earlier turns until next turn.");
        return gameTurn;
    }
    @RequestMapping("/getGameAsItIsRightNow")
    public Game getGameAsItIsRightNow(@RequestParam(value="passWord") String passWord, @RequestParam(value="playerid") String playerid) {
        String gameid = ServerHelper.checkIfRegistred(playerid);
        System.out.println("gameid = " + gameid);
        System.out.println("passWord = " + passWord);
        System.out.println("playerid = " + playerid);
        if (gameid == null)
            throw new PlayerNotInAnyGameException("You are not registred as a player in any game I manage!");
        Game game = ServerHelper.runningApplicationGroup.get(passWord).get(gameid.toUpperCase());
        //game.createTotalExtractionGraph();
        return game;
    }
    //if the game is waiting for you the game itself is returned
    @RequestMapping("/gameStaus")
    public Game gameStaus(@RequestParam(value="passWord") String passWord, @RequestParam(value="playerid") String playerid) {
        //kolla om aktiv i spel
        String gameid = ServerHelper.checkIfRegistred(playerid);
        if (gameid == null)
            throw new PlayerNotInAnyGameException("You are not registred as a player in any game I manage!");
        //kolla om väntar på inlämning från andra
        Game game = ServerHelper.runningApplicationGroup.get(passWord).get(gameid.toUpperCase());
        if (game.hasReapedResourcesThisTurn(playerid))
            throw new PlayerAlreadyPostedThisTurn("You have already reaped resources this turn." +
                    "\nPlease wait until next turn begins.");
        else
            //annars andra väntar på din inlämning
            return game;

    }
}
