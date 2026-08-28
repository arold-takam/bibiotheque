package com.ibizabroker.bibliotheque.entity;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import lombok.Data;

import javax.persistence.*;
import java.util.Date;

@Data
@Entity
@Table(name = "Reservation")
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer reservationId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "book_id", nullable = false)
    private Books livre;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "adherent_id", nullable = false)
    private Users adherent;

    @Temporal(TemporalType.TIMESTAMP)
    @JsonSerialize(using = JsonDataSerializer.class)
    private Date dateReservation;

    @Temporal(TemporalType.TIMESTAMP)
    @JsonSerialize(using = JsonDataSerializer.class)
    private Date dateExpiration;

    @Enumerated(EnumType.STRING)
    private ReservationStatut statut;
}
