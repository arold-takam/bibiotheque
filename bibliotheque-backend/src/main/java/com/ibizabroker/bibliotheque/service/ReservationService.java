package com.ibizabroker.bibliotheque.service;

import com.ibizabroker.bibliotheque.dao.BooksRepository;
import com.ibizabroker.bibliotheque.dao.ReservationRepository;
import com.ibizabroker.bibliotheque.dao.UsersRepository;
import com.ibizabroker.bibliotheque.dto.ReservationRequest;
import com.ibizabroker.bibliotheque.dto.ReservationResponse;
import com.ibizabroker.bibliotheque.entity.Books;
import com.ibizabroker.bibliotheque.entity.Reservation;
import com.ibizabroker.bibliotheque.entity.ReservationStatut;
import com.ibizabroker.bibliotheque.entity.Users;
import com.ibizabroker.bibliotheque.exceptions.InvalidRequestException;
import com.ibizabroker.bibliotheque.exceptions.NotFoundException;
import com.ibizabroker.bibliotheque.exceptions.RuleViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

@Service
public class ReservationService {

    private static final int EXPIRATION_JOURS = 7;
    private static final int MAX_RESERVATIONS_ACTIVES = 3;
    private static final List<ReservationStatut> STATUTS_ACTIFS =
            List.of(ReservationStatut.EN_ATTENTE, ReservationStatut.DISPONIBLE);

    private final ReservationRepository reservationRepository;
    private final BooksRepository booksRepository;
    private final UsersRepository usersRepository;

    public ReservationService(ReservationRepository reservationRepository,
                              BooksRepository booksRepository,
                              UsersRepository usersRepository) {
        this.reservationRepository = reservationRepository;
        this.booksRepository = booksRepository;
        this.usersRepository = usersRepository;
    }

    @Transactional
    public ReservationResponse createReservation(ReservationRequest request) {
        // --- Validation de la requête : livreId et adherentId obligatoires (400) ---
        if (request.getLivreId() == null && request.getAdherentId() == null) {
            throw new InvalidRequestException("livreId et adherentId sont obligatoires.");
        }
        if (request.getLivreId() == null) {
            throw new InvalidRequestException("livreId est obligatoire.");
        }
        if (request.getAdherentId() == null) {
            throw new InvalidRequestException("adherentId est obligatoire.");
        }

        Books livre = booksRepository.findById(request.getLivreId())
                .orElseThrow(() -> new NotFoundException("Livre avec l'id " + request.getLivreId() + " introuvable."));
        Users adherent = usersRepository.findById(request.getAdherentId())
                .orElseThrow(() -> new NotFoundException("Adherent avec l'id " + request.getAdherentId() + " introuvable."));

        // --- RG-01 : on ne réserve qu'un livre indisponible ---
        boolean disponible = livre.getDisponible() != null
                ? livre.getDisponible()
                : (livre.getNoOfCopies() != null && livre.getNoOfCopies() > 0);
        if (disponible) {
            throw new RuleViolationException(
                    "RG-01 : le livre \"" + livre.getBookName() + "\" est disponible, impossible de le réserver.");
        }

        // --- RG-02 : un adhérent ne peut avoir qu'une seule réservation active sur un même livre ---
        long activesSurCeLivre = reservationRepository
                .countByAdherent_UserIdAndLivre_BookIdAndStatutIn(adherent.getUserId(), livre.getBookId(), STATUTS_ACTIFS);
        if (activesSurCeLivre > 0) {
            throw new RuleViolationException(
                    "RG-02 : l'adherent a déjà une réservation active sur ce livre.");
        }

        // --- RG-03 : max 3 réservations actives simultanées par adhérent ---
        long activesTotales = reservationRepository
                .countByAdherent_UserIdAndStatutIn(adherent.getUserId(), STATUTS_ACTIFS);
        if (activesTotales >= MAX_RESERVATIONS_ACTIVES) {
            throw new RuleViolationException(
                    "RG-03 : l'adherent a déjà " + MAX_RESERVATIONS_ACTIVES + " réservations actives.");
        }

        Reservation reservation = new Reservation();
        reservation.setLivre(livre);
        reservation.setAdherent(adherent);
        reservation.setDateReservation(new Date());
        reservation.setDateExpiration(calculeDateExpiration(reservation.getDateReservation()));
        reservation.setStatut(ReservationStatut.EN_ATTENTE);

        Reservation saved = reservationRepository.save(reservation);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> getAllReservations(ReservationStatut statut, Integer adherentId) {
        List<Reservation> reservations;
        if (statut != null && adherentId != null) {
            reservations = reservationRepository.findByAdherent_UserIdAndStatut(adherentId, statut);
        } else if (statut != null) {
            reservations = reservationRepository.findByStatut(statut);
        } else if (adherentId != null) {
            reservations = reservationRepository.findByAdherent_UserId(adherentId);
        } else {
            reservations = reservationRepository.findAll();
        }
        List<ReservationResponse> responses = new ArrayList<>();
        for (Reservation r : reservations) {
            responses.add(toResponse(r));
        }
        return responses;
    }

    @Transactional(readOnly = true)
    public ReservationResponse getReservation(Integer id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Réservation avec l'id " + id + " introuvable."));
        return toResponse(reservation);
    }

    @Transactional
    public ReservationResponse annulerReservation(Integer id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Réservation avec l'id " + id + " introuvable."));

        // --- RG-06 : statuts terminaux non modifiables ---
        if (reservation.getStatut() == ReservationStatut.ANNULEE
                || reservation.getStatut() == ReservationStatut.EXPIREE
                || reservation.getStatut() == ReservationStatut.HONOREE) {
            throw new RuleViolationException(
                    "RG-06 : une réservation au statut " + reservation.getStatut() + " ne peut plus changer d'état.");
        }

        // --- RG-05 : on n'annule que si EN_ATTENTE ou DISPONIBLE ---
        if (reservation.getStatut() != ReservationStatut.EN_ATTENTE
                && reservation.getStatut() != ReservationStatut.DISPONIBLE) {
            throw new RuleViolationException(
                    "RG-05 : une réservation au statut " + reservation.getStatut() + " ne peut pas être annulée.");
        }

        reservation.setStatut(ReservationStatut.ANNULEE);
        return toResponse(reservationRepository.save(reservation));
    }

    @Transactional
    public ReservationResponse passerDisponible(Integer id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Réservation avec l'id " + id + " introuvable."));
        if (statutTerminal(reservation.getStatut())) {
            throw new RuleViolationException("RG-06 : une réservation au statut " + reservation.getStatut()
                    + " ne peut plus changer d'état.");
        }
        if (reservation.getStatut() != ReservationStatut.EN_ATTENTE) {
            throw new RuleViolationException(
                    "Règle : seule une réservation EN_ATTENTE peut passer à DISPONIBLE.");
        }
        reservation.setStatut(ReservationStatut.DISPONIBLE);
        return toResponse(reservationRepository.save(reservation));
    }

    @Transactional
    public ReservationResponse honorer(Integer id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Réservation avec l'id " + id + " introuvable."));
        if (statutTerminal(reservation.getStatut())) {
            throw new RuleViolationException("RG-06 : une réservation au statut " + reservation.getStatut()
                    + " ne peut plus changer d'état.");
        }
        if (reservation.getStatut() != ReservationStatut.DISPONIBLE) {
            throw new RuleViolationException(
                    "Règle : une réservation ne peut être honorée que si elle est DISPONIBLE.");
        }
        reservation.setStatut(ReservationStatut.HONOREE);
        return toResponse(reservationRepository.save(reservation));
    }

    private boolean statutTerminal(ReservationStatut statut) {
        return statut == ReservationStatut.ANNULEE
                || statut == ReservationStatut.EXPIREE
                || statut == ReservationStatut.HONOREE;
    }

    @Transactional
    public void deleteReservation(Integer id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Réservation avec l'id " + id + " introuvable."));
        reservationRepository.delete(reservation);
    }

    private Date calculeDateExpiration(Date dateReservation) {
        // RG-04 : dateExpiration = dateReservation + 7 jours, calculée côté serveur.
        Calendar c = Calendar.getInstance();
        c.setTime(dateReservation);
        c.add(Calendar.DATE, EXPIRATION_JOURS);
        return c.getTime();
    }

    private ReservationResponse toResponse(Reservation r) {
        ReservationResponse response = new ReservationResponse();
        response.setReservationId(r.getReservationId());
        response.setLivreId(r.getLivre() != null ? r.getLivre().getBookId() : null);
        response.setLivreName(r.getLivre() != null ? r.getLivre().getBookName() : null);
        response.setAdherentId(r.getAdherent() != null ? r.getAdherent().getUserId() : null);
        response.setAdherentName(r.getAdherent() != null ? r.getAdherent().getName() : null);
        response.setDateReservation(r.getDateReservation());
        response.setDateExpiration(r.getDateExpiration());
        response.setStatut(r.getStatut());
        return response;
    }
}
