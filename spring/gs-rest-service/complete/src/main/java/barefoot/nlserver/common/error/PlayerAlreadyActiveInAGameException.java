package barefoot.nlserver.common.error;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(value= HttpStatus.IM_USED)
public class PlayerAlreadyActiveInAGameException extends ServerError {
    public PlayerAlreadyActiveInAGameException(String message) {
        super(message);
    }
}
