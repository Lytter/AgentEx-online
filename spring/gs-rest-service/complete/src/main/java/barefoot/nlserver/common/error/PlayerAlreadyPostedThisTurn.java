package barefoot.nlserver.common.error;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(value= HttpStatus.BAD_REQUEST)
public class PlayerAlreadyPostedThisTurn extends ServerError {
    public PlayerAlreadyPostedThisTurn(String message) {
        super(message);
    }
}
