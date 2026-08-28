package com.ibizabroker.bibliotheque.dto;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.ibizabroker.bibliotheque.entity.JsonDataSerializer;
import com.ibizabroker.bibliotheque.entity.ReservationStatut;
import lombok.Data;

import java.util.Date;

/**
 * DTO de sortie d'une réservation.
 * L'entité Reservation ne sort jamais du service.
 */
@Data
public class ReservationResponse {

    private Integer reservationId;

    private Integer livreId;

    private String livreName;

    private Integer adherentId;

    private String adherentName;

    @JsonSerialize(using = JsonDataSerializer.class)
    private Date dateReservation;

    @JsonSerialize(using = JsonDataSerializer.class)
    private Date dateExpiration;

    private ReservationStatut statut;
}