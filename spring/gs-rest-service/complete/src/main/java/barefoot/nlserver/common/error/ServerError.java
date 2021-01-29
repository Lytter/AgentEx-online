package barefoot.nlserver.common.error;

public abstract class ServerError extends RuntimeException {
    public ServerError(String message) {
        super(message);
    }

    public String getMessage() {
        return super.getMessage();
    }
}
