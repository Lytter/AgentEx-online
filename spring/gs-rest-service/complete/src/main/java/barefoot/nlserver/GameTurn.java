package barefoot.nlserver;

import barefoot.nlserver.common.ServerHelper;
import org.jfree.chart.ChartFactory;
import org.jfree.chart.ChartUtilities;
import org.jfree.chart.JFreeChart;
import org.jfree.chart.labels.PieSectionLabelGenerator;
import org.jfree.chart.labels.StandardPieSectionLabelGenerator;
import org.jfree.chart.plot.PiePlot;
import org.jfree.data.general.DefaultPieDataset;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.text.DecimalFormat;
import java.util.*;

public class GameTurn {

    public String getYieldsGraph() {
        return yieldsGraph;
    }

    public void setYieldsGraph(String yieldsGraph) {
        this.yieldsGraph = yieldsGraph;
    }

    public void toXml(Document doc, Element game) {
        Element turn = doc.createElement("GameTurn");
        turn.setAttribute("ID",""+id);
        turn.setAttribute("Resources_In", ""+resources_in);
        turn.setAttribute("Resources_Out", ""+resoutces_out);
        for (Yield y : yields) {
            y.toXml(doc, turn);
        }
        for (Communication c : communications) {
            c.toXml(doc, turn);
        }
        for (Confidence c : conficenceInOptimalStockSize) {
            c.toXml(doc, turn);
        }
        game.appendChild(turn);
    }

    public static class Confidence {
        public String playerid;
        public double confidence;
        public Confidence(String pid, double a) {
            playerid = pid;
            confidence = a;
        }

        public void toXml(Document doc, Element turn) {
            Element yield = doc.createElement("KnowledgeConfidence");
            yield.setAttribute("User", playerid);
            yield.setAttribute("Confidence", ""+confidence);
            turn.appendChild(yield);
        }
    }

    public static class Yield {
        public String playerid;
        public double amount;
        public Yield(String pid, double a) {
            playerid = pid;
            amount = a;
        }

        public void toXml(Document doc, Element turn) {
            Element yield = doc.createElement("Yield");
            yield.setAttribute("User", playerid);
            yield.setAttribute("Amount", ""+amount);
            turn.appendChild(yield);
        }
    }
    public static class Communication {
        public String playerid;
        public String message;
        public long timeStamp;
        public Communication(String pid, String mess) {
            timeStamp = new Date().getTime();
            playerid = pid;
            message = mess;
        }
        public void toXml(Document doc, Element turn) {
            Element communictaion = doc.createElement("Communication");
            communictaion.setAttribute("User", playerid);
            communictaion.setAttribute("Message", message);
            communictaion.setAttribute("Time", ""+timeStamp);
            turn.appendChild(communictaion);
        }
    }

    public int id;
    private UUID gameID;
    private int status = 200;  //200 -> is running, 201 -> last round
    private double resources_in;
    private double resoutces_out;
    private String yieldsGraph;
    private String yieldsGraphLocal;
    public ArrayList<Yield> yields = new ArrayList<>();
    public ArrayList<Communication> communications = new ArrayList<>();
    public ArrayList<Confidence> conficenceInOptimalStockSize = new ArrayList<>();

    public int getStatus() {
        return status;
    }
    public void setStatus(int s) {
        status = s;
    }
    public double getResoutcesOut() {
        return resoutces_out;
    }
    public double getResources_in() {
        return resources_in;
    }
    public List<Yield> getYields() {return yields;}


    public GameTurn(int id, UUID gameid, double resources, boolean lastTurn) {
        this.id = id;
        gameID = gameid;
        resources_in = resources;
        if(resources == 50)
            resoutces_out = resources;
        status = lastTurn ? 201 : 200;
        //setYieldsGraph("testar detta");
    }


/*
    public void createYieldsGraph() {
        // Create a simple pie chart
        DefaultPieDataset pieDataset = new DefaultPieDataset();
        pieDataset.setValue("Missing", 50 - resoutces_out);
        pieDataset.setValue("Available", resoutces_out);
        JFreeChart chart = ChartFactory.createPieChart
                ("Resource pool size", // Title
                        pieDataset, // Dataset
                        true, // Show legend
                        true, // Use tooltips
                        false // Configure chart to generate URLs?
                );
        PiePlot plot = (PiePlot) chart.getPlot();
        //plot.setSectionPaint(KEY1, Color.green);
        //plot.setSectionPaint(KEY2, Color.red);
        //plot.setExplodePercent("User 0", 0.10);
        plot.setSimpleLabels(true);

        PieSectionLabelGenerator gen = new StandardPieSectionLabelGenerator(
                "{0}: {1}", new DecimalFormat("###.##"), new DecimalFormat("0%"));
        plot.setLabelGenerator(gen);
        try {
            String home = NLServer.argsx[1];//new JFileChooser().getFileSystemView().getDefaultDirectory().toString();
            File dir = new File(String.format("%s/games/%s",home, gameID));
            Files.createDirectories(Paths.get(dir.toURI()));
            File file = new File(dir, String.format("turnChart_%s.png",id));
            ChartUtilities.saveChartAsJPEG(file, chart, 573, 300);
            yieldsGraphLocal = "http://" + NLServer.argsx[0] + file.getAbsolutePath().substring(NLServer.argsx[1].length());
            //URL url = ServerHelper.uploadFile(yieldsGraphLocal);
            //if (url != null)
            setYieldsGraph(yieldsGraphLocal);
            System.out.println("yieldsGraph = " + getYieldsGraph());
        }catch (IOException ex) {
            ex.printStackTrace();
        }
    }
*/
    public void summarize(Game game) {
        System.out.println("TRYING to advanced one tick!");
        game.workspace.command("go");
        System.out.println("Game advanced one tick!");
        game.registerEndOfTurnData(id);
        System.out.println("TRYING to get resource_out");
        resoutces_out = (Double)game.workspace.report("resourceStockSize");
        //game.gameTurns[id].createYieldsGraph();
    }

}
