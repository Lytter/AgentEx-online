package hello;

public class Greeting {

    private final long id;
    private final String content;
    private String test;

    public Greeting(long id, String content) {
        this.id = id;
        this.content = content;
    }

    public long getId() {
        return id;
    }

    public String getContent() {
        return content;
    }
    public String getTest() {return test;}
    public void setTest(String t) {test = t;}
}
