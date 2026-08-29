package com.ibizabroker.bibliotheque.dto;

import lombok.Data;

/**
 * DTO d'entrée d'une réservation.
 * Le client n'envoie QUE livreId et adherentId ; tout le reste est déterminé côté serveur.
 */
@Data
public class ReservationRequest {

    private Integer livreId;

    private Integer adherentId;
}