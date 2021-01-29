import org.jfree.chart.ChartFactory;
import org.jfree.chart.ChartUtilities;
import org.jfree.chart.JFreeChart;
import org.jfree.chart.labels.PieSectionLabelGenerator;
import org.jfree.chart.labels.StandardPieSectionLabelGenerator;
import org.jfree.chart.plot.PiePlot;
import org.jfree.data.general.DefaultPieDataset;
import org.nlogo.app.App;
import org.nlogo.core.LogoList;

import java.io.File;
import java.text.DecimalFormat;

public class ServerExtension {
    public static void main(String[] args) {
        App.main(args);
        try {
            java.awt.EventQueue.invokeAndWait(
                    new Runnable() {
                        public void run() {
                            try {
                                App.app().open(
                                        "C:\\Users\\andlyt1ros\\Desktop\\AgentExV1.1.nlogo");
                            }
                            catch(java.io.IOException ex) {
                                ex.printStackTrace();
                            }}});
            //App.app().command("set density 62");
            //App.app().command("random-seed 0");
            App.app().command("setup");
            App.app().command("repeat 5 [ go ]");
            //App.app().command("export-extraction");
            //System.out.println(App.app().report("extractionPerTurnList"));
            System.out.println(App.app().report("[extractionPerTurnList] of user 0"));
            LogoList array = (LogoList) App.app().report("[extractionPerTurnList] of user 0");
            for (Object item: array.javaIterable()) {
                System.out.println(item.getClass());
            }
            System.out.println(array.getClass());
            // Create a simple pie chart
            DefaultPieDataset pieDataset = new DefaultPieDataset();
            pieDataset.setValue("User 0", new Integer(75));
            pieDataset.setValue("User 1", new Integer(10));
            pieDataset.setValue("User 2", new Integer(10));
            pieDataset.setValue("User 3", new Integer(5));
            JFreeChart chart = ChartFactory.createPieChart
                    ("CSC408 Mark Distribution", // Title
                            pieDataset, // Dataset
                            true, // Show legend
                            true, // Use tooltips
                            false // Configure chart to generate URLs?
                    );
            PiePlot plot = (PiePlot) chart.getPlot();
            //plot.setSectionPaint(KEY1, Color.green);
            //plot.setSectionPaint(KEY2, Color.red);
            plot.setExplodePercent("User 0", 0.10);
            plot.setSimpleLabels(true);

            PieSectionLabelGenerator gen = new StandardPieSectionLabelGenerator(
                    "{0}: {1} ({2})", new DecimalFormat("0"), new DecimalFormat("0%"));
            plot.setLabelGenerator(gen);
            try {
                ChartUtilities.saveChartAsJPEG(new File("C:\\tmp2\\chart.jpg"), chart, 500, 300);
            } catch (Exception e) {
                System.out.println("Problem occurred creating chart.");
            }

            System.out.println(
                    "Done");
        }
        catch(Exception ex) {
            ex.printStackTrace();
        }
    }
}
