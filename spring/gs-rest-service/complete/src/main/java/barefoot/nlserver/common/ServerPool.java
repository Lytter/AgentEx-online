package barefoot.nlserver.common;

import org.nlogo.headless.HeadlessWorkspace;

import java.util.ArrayList;
import java.util.concurrent.ConcurrentHashMap;

public class ServerPool {
    private static final int MIN_AMOUNT_SERVERS = 1;
    private static final ConcurrentHashMap<String, ArrayList<HeadlessWorkspace>> availiable = new ConcurrentHashMap<String, ArrayList<HeadlessWorkspace>>();
    private static final ConcurrentHashMap<String, ArrayList<HeadlessWorkspace>> inUse = new ConcurrentHashMap<String, ArrayList<HeadlessWorkspace>>();
    public static void shrinkPool() {
        synchronized (availiable) {
            for (String groupId : availiable.keySet()) {
                if (availiable.get(groupId).size() > MIN_AMOUNT_SERVERS)
                    for (int i = availiable.get(groupId).size() - 1; i >= MIN_AMOUNT_SERVERS; i--) {
                        HeadlessWorkspace ws = availiable.get(groupId).get(i);
                        availiable.get(groupId).remove(ws);
                        try {
                            ws.dispose();
                        } catch (InterruptedException e) {
                            e.printStackTrace();
                        }
                    }
            }
        }
    }
    public static void getEnlargePool(String groupId) {
        for (int i = 0; i < MIN_AMOUNT_SERVERS; i++) {
            HeadlessWorkspace ws = createNewWorkspace(groupId);
            availiable.computeIfAbsent(groupId, k -> new ArrayList<>());
            availiable.get(groupId).add(ws);
        }
        System.out.println("One more NetLogo, total amount = " + availiable.size() + ", " + inUse.size());
    }
    public static int getAvailableSize(String gameGroupId) {
        return availiable.get(gameGroupId).size();
    }
    public static HeadlessWorkspace getInstance(String groupId) {
        synchronized (availiable) {
            inUse.computeIfAbsent(groupId, k -> new ArrayList<>());
            if (availiable.get(groupId) == null || availiable.get(groupId).size() == 0) {
                HeadlessWorkspace ws = createNewWorkspace(groupId);
                inUse.get(groupId).add(ws);
                return ws;
            } else {
                HeadlessWorkspace ws = availiable.get(groupId).get(0);
                availiable.get(groupId).remove(ws);
                inUse.get(groupId).add(ws);
                return ws;
            }
        }
    }
    public static void returnInstance(HeadlessWorkspace ws, String groupId) {
        ws.command("setup");
        if (availiable.get(groupId) == null)
            availiable.put(groupId, new ArrayList<>());
        inUse.get(groupId).remove(ws);
        availiable.get(groupId).add(ws);
        System.out.println("NetLogo returned and reinitialized");
    }
    public static HeadlessWorkspace createNewWorkspace(String groupId) {
        HeadlessWorkspace workspace = HeadlessWorkspace.newInstance();
        try {
            workspace.open(
                    ServerHelper.applicationgroupSettings.get(groupId).get("PATH_TO_NETLOGO_MODEL"));
            System.out.println("TRYING to setup" );
            workspace.command("setup");
            System.out.println("Game created");
        } catch (Exception ex) {
            ex.printStackTrace();
        }
        return workspace;
    }
}
