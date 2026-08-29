package com.ibizabroker.bibliotheque.controller;

import com.ibizabroker.bibliotheque.dto.ReservationRequest;
import com.ibizabroker.bibliotheque.dto.ReservationResponse;
import com.ibizabroker.bibliotheque.entity.ReservationStatut;
import com.ibizabroker.bibliotheque.service.ReservationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur du module Réservation.
 * Aucune logique métier : tout est délégué à ReservationService.
 */
@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @PostMapping
    public ResponseEntity<ReservationResponse> createReservation(@RequestBody ReservationRequest request) {
        ReservationResponse created = reservationService.createReservation(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<ReservationResponse>> getAllReservations(
            @RequestParam(required = false) ReservationStatut statut,
            @RequestParam(required = false) Integer adherentId) {
        return ResponseEntity.ok(reservationService.getAllReservations(statut, adherentId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReservationResponse> getReservation(@PathVariable Integer id) {
        return ResponseEntity.ok(reservationService.getReservation(id));
    }

    @PatchMapping("/{id}/annuler")
    public ResponseEntity<ReservationResponse> annulerReservation(@PathVariable Integer id) {
        return ResponseEntity.ok(reservationService.annulerReservation(id));
    }

    @PutMapping("/{id}/disponible")
    public ResponseEntity<ReservationResponse> passerDisponible(@PathVariable Integer id) {
        return ResponseEntity.ok(reservationService.passerDisponible(id));
    }

    @PutMapping("/{id}/honorer")
    public ResponseEntity<ReservationResponse> honorer(@PathVariable Integer id) {
        return ResponseEntity.ok(reservationService.honorer(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReservation(@PathVariable Integer id) {
        reservationService.deleteReservation(id);
        return ResponseEntity.noContent().build();
    }
}
