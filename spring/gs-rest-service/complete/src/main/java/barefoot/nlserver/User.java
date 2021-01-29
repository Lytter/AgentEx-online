package barefoot.nlserver;

import org.w3c.dom.Document;
import org.w3c.dom.Element;

import java.util.UUID;

public class User {
    private String ID;  //UUID or FaceBookId
    private String index; //0-4
    private boolean isHuman;
    private int typingSkill;
    private boolean speaker;
    private double optimalStockSize;

    public void toXml(Document doc, Element game) {
        Element user = doc.createElement("User");
        user.setAttribute("ID",ID);
        user.setAttribute("IsHuman", isHuman ? "true" : "false");
        user.setAttribute("Speaker", speaker ? "true" : "false");
        game.appendChild(user);
    }
    public User(String ID, Game game, int position) {
        this(ID, ""+position, true, 0 , false, 0, 0);
        if(game != null && position >= 0) {
            System.out.println("TRYING to set userIsHuman! -> " + position);
            game.workspace.command("ask user " + position + " [ set userIsHuman 1 ]");
            System.out.println("TRYING to set speaker! -> " + position);
            game.workspace.command("ask user " + position + " [ set speaker 0 ]");
        }
    }
    public User(String ID, String index, boolean isHuman, int typingSkill, boolean speaker, double optimalStockSize, double trustInOptimalStockSize) {
        this.ID = ID;
        this.index = index;
        this.isHuman = isHuman;
        this.typingSkill = typingSkill;
        this.speaker = speaker;
    }

    public User(String index, Game game) {
        ID = UUID.randomUUID().toString();
        this.index = index;
        isHuman = false;
        typingSkill = 1;
        System.out.println("TRYING to get speaker! -> " + ID );
        double tmp = (Double) game.workspace.report("[speaker] of user "+index);
        speaker = tmp > 0;
        System.out.println("TRYING to get knowledge! -> " + ID );
        optimalStockSize = (Double)game.workspace.report("[individualKnowledge] of user "+index);
        System.out.println("TRYING to get confidence! -> " + ID );
    }

    @Override
    public int hashCode() {
        return ID.hashCode();
    }
    @Override
    public boolean equals(Object obj) {
        if(obj == null)
            return false;
        if (obj instanceof User)
            return this.ID.equals(((User)obj).getID());
        throw new IllegalArgumentException("Object must Be a User");
    }

    public String getID() {
        return ID;
    }

    public int getTypingSkill() {
        return typingSkill;
    }

    public void setTypingSkill(int typingSkill) {
        this.typingSkill = typingSkill;
    }

    public boolean getSpeaker() {
        return speaker;
    }

    public void setSpeaker(boolean speaker) {
        this.speaker = speaker;
    }

    public double getOptimalStockSize() {
        return optimalStockSize;
    }

    public void setOptimalStockSize(double optimalStockSize) {
        this.optimalStockSize = optimalStockSize;
    }

    public boolean isHuman() {
        return isHuman;
    }
}
