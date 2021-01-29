package barefoot.nlserver.common.error;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(value= HttpStatus.NOT_ACCEPTABLE)
public class GameTurnNotEndedYet extends ServerError{
    public GameTurnNotEndedYet(String message) {
        super(message);
    }
}
