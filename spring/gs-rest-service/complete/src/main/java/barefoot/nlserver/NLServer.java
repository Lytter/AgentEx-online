package barefoot.nlserver;

import barefoot.nlserver.common.ServerHelper;
import barefoot.nlserver.common.ServerPool;
import barefoot.nlserver.common.error.GameTurnNotEndedYet;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.concurrent.ConcurrentHashMap;

@SpringBootApplication
public class NLServer {
    public static String[] argsx;
    public static void main(String[] args) {
        argsx = args;
        new Thread(new Runnable() {
            @Override
            public void run() {
                while (true) {
                    try {
                        Thread.sleep(2000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    synchronized (ServerHelper.runningApplicationGroup) {
                        for (ConcurrentHashMap<String, Game> applications : ServerHelper.runningApplicationGroup.values()) {
                            for (Game game : applications.values()) {
                                try {
                                    if (game.getHumanPlayers() > 0) {
                                        GameTurn turn = ServerHelper.checkIfTurnIsFinished(game);
                                        if (turn.getStatus() == 200) {
                                            ServerHelper.SendMessageBackToMessenger(game, "EndOfTurn");
                                            System.out.println("Turn Done!!");
                                        } else if (turn.getStatus() == 201) {
                                            ServerHelper.getGameResult(game.getId());
                                            ServerHelper.SendMessageBackToMessenger(game, "EndOfGame");
                                            System.out.println("Game Finished!!");
                                        }
                                    }
                                } catch (GameTurnNotEndedYet TurnNotDone) {
                                    System.out.println("TurnNotDone = " + "True");
                                }
                            }
                        }
                    }
                }
            }
        }).start();
        new Thread(() -> {
            while (true) {
                try {
                    Thread.sleep(60000); //set at 60 000
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                ServerPool.shrinkPool(); //MÅSTE GÅIGENOM ALLA GRUPPER
            }
        }).start();
        SpringApplication.run(NLServer.class, args);
    }
}
