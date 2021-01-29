package barefoot.nlserver.common;

import java.util.Random;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public class IdHelper {
    private static ConcurrentHashMap<UUID, String> idMap = new ConcurrentHashMap<>();
    //private static HashMap<String, Integer> idCounterMap = new HashMap<>();
    public static void setReadableId(UUID id) {
        String cewlName = getRandomCewlName();
        //int usedAmount = idCounterMap.get(cewlName) == null ? 1 : idCounterMap.get(cewlName)+1;
        idMap.put(id, cewlName + "__" + id);
    }
    public static String getReadableId(UUID id) {
        return idMap.get(id);
    }
    public static void reset() {
        idMap = new ConcurrentHashMap<>();
        //idCounterMap = new HashMap<>();
    }
    private static String getRandomCewlName() {
        String[] names = {
                "Grand_Banks_fisheries",
                "Bluefin_Tuna",
                "Passenger_pigeons",
                "Ocean_garbage_gyres",
                "Atmosphere_of_Earth",
                "Gulf_of_Mexico_dead_zone",
                "Traffic_congestion",
                "Groundwater_in_Los_Angeles",
                "Unregulated_logging",
                "Population_growth"
        };
        String stringId;
        //do {
            stringId = names[new Random().nextInt(10)];
        //} while (idMap.containsValue(stringId));
        return stringId;
    }
}
