package barefoot.nlserver.common.error;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(value= HttpStatus.INSUFFICIENT_STORAGE)
public class NoRoomForPlayerInGameException extends ServerError {
    public NoRoomForPlayerInGameException(String message) {
        super(message);
    }
}
