package barefoot.nlserver.common.error;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(value= HttpStatus.NOT_FOUND)
public class InvalidGameGroupException extends ServerError{
    public InvalidGameGroupException(String message) {
        super(message);
    }
}