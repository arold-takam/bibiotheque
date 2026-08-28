package com.ibizabroker.bibliotheque.entity;

/**
 * Statuts possibles d'une réservation.
 * Une réservation est dite "active" si son statut est EN_ATTENTE ou DISPONIBLE.
 */
public enum ReservationStatut {
    EN_ATTENTE,
    DISPONIBLE,
    ANNULEE,
    EXPIREE,
    HONOREE
}
