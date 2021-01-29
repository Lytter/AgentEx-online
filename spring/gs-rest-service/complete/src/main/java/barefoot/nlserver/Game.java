package barefoot.nlserver;
/*
Frågor
- Begränsningar i skördande? Vad är rimligt?
- Konversation, och hur man ska komma överens om en gemensam
skörd.
- Test och verifiering, hur många och vad kolla efter?
- Feedback till spelaren, vilka grafer.
- Utvärdering, vilka grafer bör vi kolla på?

TODO
1. Hantera tidsgräns för att lämna in sitt drag, om fail avsluta spelet.
 */


import barefoot.nlserver.common.IdHelper;
import barefoot.nlserver.common.ServerHelper;
import barefoot.nlserver.common.ServerPool;
import barefoot.nlserver.common.error.NoRoomForPlayerInGameException;
import barefoot.nlserver.common.error.PlayerAlreadyPostedThisTurn;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.text.DecimalFormat;
import java.util.Arrays;
import java.util.Random;
import java.util.UUID;

import org.jfree.chart.ChartFactory;
import org.jfree.chart.ChartPanel;
import org.jfree.chart.ChartUtilities;
import org.jfree.chart.JFreeChart;
import org.jfree.chart.labels.PieSectionLabelGenerator;
import org.jfree.chart.labels.StandardPieSectionLabelGenerator;
import org.jfree.chart.plot.PiePlot;
import org.jfree.chart.plot.PlotOrientation;
import org.jfree.data.category.DefaultCategoryDataset;
import org.jfree.data.general.DefaultPieDataset;
import org.nlogo.core.LogoList;
import org.nlogo.core.WorldDimensions;
import org.nlogo.headless.HeadlessWorkspace;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import javax.swing.*;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerConfigurationException;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;

import static barefoot.nlserver.GameController.MAX_TURNS;

public class Game {
    public final int MAX_PLAYERS = 4;
    public static final int TURN_CURRENT = -2;
    public static final int TURN_NEW = -1;
    public UUID id;
    private final int status = 200;
    private final User[] players = new User[MAX_PLAYERS];
    private int humanPlayers = 0;
    private int maxHumanPlayers = 1;
    private int maxTimeSpanForSignup = 1000;
    private long firstSignup;
    public transient HeadlessWorkspace workspace;
    public boolean gameHasFinished = false;
    private String totalExtractionGraph;
    private String totalExtractionGraphLocal;
    private String gameGroupId;
    public String getGameGroupId(){return gameGroupId;}

    public GameTurn[] gameTurns = new GameTurn[MAX_TURNS];

    public Game(UUID id, String gameGroupId, int maxHumanPlayers, int maxTimeSpanForSignup) {
        this.id = id;
        this.gameGroupId = gameGroupId;
        this.maxTimeSpanForSignup = maxTimeSpanForSignup;
        IdHelper.setReadableId(id);
        this.maxHumanPlayers = maxHumanPlayers;
        gameTurns[0] = new GameTurn(0, id,50, false);
        workspace = ServerPool.getInstance(getGameGroupId());
        try {
            String filepath = ServerHelper.applicationgroupSettings.get(gameGroupId).get("PATH_TO_NETLOGO_WORLD");//new JFileChooser().getFileSystemView().getDefaultDirectory().toString();
            File worldData = new File(filepath);
            workspace.command("importExperimentSettings \"" + worldData.getAbsolutePath().replace("\\", "/") + "\"");
        } catch(Exception e) {
            e.printStackTrace();
        }
        workspace.command("setup");
        workspace.command("set endOfGame " + (MAX_TURNS-1));
        fillUpWithBots();
        new Thread(() -> {
            if (ServerPool.getAvailableSize(gameGroupId) < 1) {
                ServerPool.getEnlargePool(gameGroupId);
            }
        }).start();
    }

    private void fillUpWithBots() {
        Random r = new Random();
        for (int i = 0; i < MAX_PLAYERS; i++) {
            players[i] = new User(""+i, this);
        }
    }

    public String getId() {
        return IdHelper.getReadableId(id);
    }
    public int getMaxHumanPlayers() {return maxHumanPlayers;}
    public int getMaxTimeSpanForSignup() {return maxTimeSpanForSignup;}
    public long getRemainingSignupTime() {return (maxTimeSpanForSignup - (System.currentTimeMillis() - firstSignup)) / 1000;}
    public int getHumanPlayers() {return humanPlayers;}
    public void increaseHumanPlayers() {
        long now = System.currentTimeMillis();
        if (firstSignup == 0 || now - maxTimeSpanForSignup <= firstSignup) {
            humanPlayers++;
            firstSignup = firstSignup == 0 ? now : firstSignup;
        } else {
            throw new NoRoomForPlayerInGameException("The game is already filled with players");
        }

    }

    public int getStatus() {
        return status;
    }

    public boolean hasRoomForMoreHumanPlayers() {
        long now = System.currentTimeMillis();
        boolean isOK = humanPlayers < maxHumanPlayers && (now - maxTimeSpanForSignup < firstSignup);
        if(isOK)
            firstSignup += 1000;
        return isOK;
    }

    public User[] getPlayers() {
        return players;
    }

    public boolean hasReapedResourcesThisTurn(String playerid) {
        int round = getCurrentTurnIndex();
        for (GameTurn.Yield yield : gameTurns[round].yields) {
            if (yield.playerid.equalsIgnoreCase(playerid))
                return true;
        }
        return false;
    }

    public void registerYield(String playerID, int amount) {
        //hitta senaste rundan
        int round = getCurrentTurnIndex();
        //lägg till uttag om inte redan registrerat
        if (hasReapedResourcesThisTurn(playerID))
            throw new PlayerAlreadyPostedThisTurn("You have already withdrawn resources this turn. Please wait until next turn begins.");
        /*
        register and advance turn one tick
         */
        //workspace.command("ask user 0 [ set userIsHuman true ]");
        //workspace.command("ask user 0 [ set userIsHuman true ]");
        //workspace.command("ask user 0 [ set actualExtraction " + amount + "]");
        int userIndex = getPositionForPlayer(playerID);
        //ANVÄND userIndex för att sätta rätt värde
        System.out.println("TRYING to setExtractionForUser!");
        workspace.command("setExtractionForUser " + userIndex + " " + amount  ); //fixa så att jag sätter för rätt spelare
        gameTurns[round].yields.add(new GameTurn.Yield(playerID, amount));
        getPlayers()[userIndex].setSpeaker(true);
        System.out.println("END OF YIELD REGISTRATION");
    }

    public void updateGroupKnowledge(String playerID, double optimalPoolSize) {
        int round = getCurrentTurnIndex();
        System.out.println("playerID = " + playerID);
        int userIndex = getPositionForPlayer(playerID);
        System.out.println("TRYING to updateGroupAndUserKnowledge! -> " +userIndex);
        workspace.command("updateGroupAndUserKnowledge " + userIndex + " " + optimalPoolSize  );
        System.out.println("END OF GROUP KNOWLEDGE");
        //Uppdatera användarens egna optimal...
        getPlayers()[userIndex].setOptimalStockSize(optimalPoolSize);
        //Läs tillbaka nya värden till respektive användare
        for (int i = humanPlayers; i < MAX_PLAYERS; i++) {
            System.out.println("TRYING to get individualKnowledge! -> " + i );
            Double newKnowledge = (Double)workspace.report("[individualKnowledge] of user "+i);
            System.out.println("i = " + i);
            System.out.println("newKnowledge = " + newKnowledge);
            getPlayers()[i].setOptimalStockSize(newKnowledge);
        }
    }

    public void registerEndOfTurnData(int round) {
        gameTurns[round].yields.clear();
        gameTurns[round].conficenceInOptimalStockSize.clear();
        for (int i = 0; i < MAX_PLAYERS; i++) {
            System.out.println("TRYING to get extractionPerTurnList! -> " + i );
            LogoList user = (LogoList) workspace.report("[extractionPerTurnList] of user "+i);
            gameTurns[round].yields.add(new GameTurn.Yield(getPlayers()[i].getID(), (Double)user.get(round)));
            System.out.println("TRYING to get conficence for user -> " + i );
            Double conf = (Double)workspace.report("[confidenceKnowledge] of user "+i);
            gameTurns[round].conficenceInOptimalStockSize.add(new GameTurn.Confidence(getPlayers()[i].getID(), conf));
        }
    }

    public boolean advanceToNextTurn() {
        if(getHumanPlayers() < maxHumanPlayers)
            if (System.currentTimeMillis() - maxTimeSpanForSignup > firstSignup) {
                maxHumanPlayers = getHumanPlayers();
                ServerHelper.SendMessageBackToMessenger(this,"gameHasStarted");
            }
            else
                return false;
        int turn = getCurrentTurnIndex();
        if (gameTurns[turn].yields.size() == getHumanPlayers()) {
            gameTurns[turn].summarize(this);
            if (gameTurns[turn].getResoutcesOut() > 0 && ++turn < MAX_TURNS)
                gameTurns[turn] = new GameTurn(turn, id, gameTurns[turn - 1].getResoutcesOut(), false);
            else
                gameHasFinished = true;
            return !gameHasFinished;
        }
        return false;
    }

    /*
    public void createTotalExtractionGraph() {
        DefaultCategoryDataset dataset = new DefaultCategoryDataset( );
        for (GameTurn turn : gameTurns) {
            if(turn != null) {
                for (GameTurn.Yield yield : turn.getYields()) {
                    dataset.addValue((Number) yield.amount, yield.playerid, turn.id + 1);
                }
            }
        }
        JFreeChart lineChart = ChartFactory.createLineChart(
                "Extraction of resources",
                "Turn","Extracted resources",
                dataset,
                PlotOrientation.VERTICAL,
                true,true,false);
        try {
            String home = NLServer.argsx[1];//new JFileChooser().getFileSystemView().getDefaultDirectory().toString();
            File dir = new File(String.format("%s/games/%s",home, id));
            Files.createDirectories(Paths.get(dir.toURI()));
            File file = new File(dir, "extractionChart.png");
            ChartUtilities.saveChartAsJPEG(file, lineChart, 573, 300); //1.91x och 1x
        }catch (IOException ex) {
            ex.printStackTrace();
        }
    }
    */

    public int getCurrentTurnIndex() {
        int nextTurn = getNextTurnIndex();
        return gameTurns[nextTurn] != null ? nextTurn : nextTurn-1;
    }
    public int getNextTurnIndex() { //Returns next empty position
        int i = 0;
        while (i < MAX_TURNS && gameTurns[i] != null)
            i++;
        return i == MAX_TURNS ? i-1 : i;
    }

    public String getTotalExtractionGraph() {
        return totalExtractionGraph;
    }

    public void setTotalExtractionGraph(String totalExtractionGraph) {
        this.totalExtractionGraph = totalExtractionGraph;
    }

    public void saveToFile() {
        DefaultCategoryDataset dataset = new DefaultCategoryDataset( );
        try {
            String home = ServerHelper.applicationgroupSettings.get(gameGroupId).get("PATH_TO_GAME_RESULT");//new JFileChooser().getFileSystemView().getDefaultDirectory().toString();
            File dir = new File(String.format("%s/games/%s",home, id));
            Files.createDirectories(Paths.get(dir.toURI()));
            File file = new File(dir, "GameResult.xml");

            DocumentBuilderFactory builderFactory =
                    DocumentBuilderFactory.newInstance();
            DocumentBuilder builder;
            try {
                builder = builderFactory.newDocumentBuilder();
                Document doc = builder.newDocument();
                this.toXml(doc);
                TransformerFactory transformerFactory = TransformerFactory.newInstance();
                Transformer transformer = transformerFactory.newTransformer();
                DOMSource domSource = new DOMSource(doc);
                StreamResult streamResult = new StreamResult(file);
                transformer.transform(domSource, streamResult);
            } catch (ParserConfigurationException | TransformerException e) {
                e.printStackTrace();
            }
            File gameWorld = new File(dir, "GameWorld.csv");
            workspace.command("exportResults \"" + gameWorld.getAbsolutePath().replace("\\", "/") + "\"") ;
        }catch (IOException ex) {
            ex.printStackTrace();
        }
    }

    private void toXml(Document doc) {
        Element game = doc.createElement("Game");
        game.setAttribute("Ended", ""+getCurrentTurnIndex());
        game.setAttribute("HumanPlayers", ""+getHumanPlayers());
        for (User gt : getPlayers()) {
            if (gt != null) {
                gt.toXml(doc, game);
            }
        }
        for (GameTurn gt : gameTurns) {
            if (gt != null) {
                gt.toXml(doc, game);
            }
        }
        doc.appendChild(game);
    }

    public Game addPlayer(String playerId) {
        if(getCurrentTurnIndex() > 0)
            throw new NoRoomForPlayerInGameException("Game has alreay started");
        int pos = 0;
        while (MAX_PLAYERS > pos && getPlayers()[pos].isHuman())
            pos++;
        if (pos < MAX_PLAYERS && pos < maxHumanPlayers) {
            getPlayers()[pos] = new User(playerId, this, pos);
            increaseHumanPlayers();
            if (humanPlayers == maxHumanPlayers)
                ServerHelper.SendMessageBackToMessenger(this,"gameHasStarted");
            return this;
        } else
            throw new NoRoomForPlayerInGameException("The game i already filed with " + MAX_PLAYERS + " players!");
    }

    public void registerChatMessage(String playerid, String message) {
        gameTurns[getCurrentTurnIndex()].communications.add(new GameTurn.Communication(playerid, message));
    }

    private String mapUser(String playerid) {
        int pos = getPositionForPlayer(playerid);
        System.out.println("playerid = " + playerid);
        if (pos >= 0)
            return String.valueOf(pos+1);
        else
            return playerid+1;
    }

    public int getPositionForPlayer(String id) {
        return Arrays.asList(getPlayers()).indexOf(new User(id, null, -1));
    }

    public void registerConfidence(String playerid, double assessment) {
        //hitta senaste rundan
        int round = getCurrentTurnIndex();
        //lägg till uttag om inte redan registrerat
        int userIndex = getPositionForPlayer(playerid);
        //ANVÄND userIndex för att sätta rätt värde
        System.out.println("TRYING to setConfidence!");
        workspace.command("ask user " + userIndex + " [ set confidenceKnowledge " + assessment + " ]");
        gameTurns[round].conficenceInOptimalStockSize.add(new GameTurn.Confidence(playerid, assessment));
        System.out.println("END OF CONFIDENCE REGISTRATION");
    }
}
