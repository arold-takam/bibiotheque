package com.ibizabroker.bibliotheque.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Levée quand une règle de gestion (RG-01 … RG-06) est violée.
 * Mappée automatiquement sur 409 Conflict, avec un message nommant la règle enfreinte.
 */
@ResponseStatus(value = HttpStatus.CONFLICT)
public class RuleViolationException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public RuleViolationException(String message) {
        super(message);
    }
}