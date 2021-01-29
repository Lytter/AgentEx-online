package barefoot.nlserver.common.error;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(value= HttpStatus.BAD_REQUEST)
public class PlayerNotInAnyGameException extends ServerError {
    public PlayerNotInAnyGameException(String message) {
        super(message);
    }
}
