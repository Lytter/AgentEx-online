package barefoot.nlserver.common.error;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(value= HttpStatus.INSUFFICIENT_STORAGE)  // 404
public class NoGameSpotOpenException extends ServerError {
    public NoGameSpotOpenException (String message) {
        super(message);
    }
}
