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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Date;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReservationServiceTest {

    @Mock private ReservationRepository reservationRepository;
    @Mock private BooksRepository booksRepository;
    @Mock private UsersRepository usersRepository;

    @InjectMocks private ReservationService reservationService;

    private Books livreIndisponible;
    private Books livreDisponible;
    private Users adherent;
    private ReservationRequest requestValid;

    @BeforeEach
    void setUp() {
        livreIndisponible = new Books();
        livreIndisponible.setBookId(7);
        livreIndisponible.setBookName("B2");
        livreIndisponible.setNoOfCopies(0);
        livreIndisponible.setDisponible(false);

        livreDisponible = new Books();
        livreDisponible.setBookId(6);
        livreDisponible.setBookName("B1");
        livreDisponible.setNoOfCopies(2);
        livreDisponible.setDisponible(true);

        adherent = new Users();
        adherent.setUserId(2);
        adherent.setUsername("A2");
        adherent.setName("A2");

        requestValid = new ReservationRequest();
        requestValid.setLivreId(7);
        requestValid.setAdherentId(2);
    }

    // --- 400 : champs manquants ---

    @Test
    void RG_00_champsManquants_throws400() {
        ReservationRequest req = new ReservationRequest();
        assertThrows(InvalidRequestException.class, () -> reservationService.createReservation(req));
    }

    @Test
    void RG_00_livreIdNull_throws400() {
        ReservationRequest req = new ReservationRequest();
        req.setAdherentId(2);
        assertThrows(InvalidRequestException.class, () -> reservationService.createReservation(req));
    }

    @Test
    void RG_00_adherentIdNull_throws400() {
        ReservationRequest req = new ReservationRequest();
        req.setLivreId(7);
        assertThrows(InvalidRequestException.class, () -> reservationService.createReservation(req));
    }

    // --- 404 : ressource inexistante ---

    @Test
    void RG_00_livreInexistant_throws404() {
        when(booksRepository.findById(999)).thenReturn(Optional.empty());
        ReservationRequest req = new ReservationRequest();
        req.setLivreId(999);
        req.setAdherentId(2);
        assertThrows(NotFoundException.class, () -> reservationService.createReservation(req));
    }

    // --- RG-01 : réserver un livre disponible → 409 ---

    @Test
    void RG_01_reserverLivreDisponible_throws409() {
        when(booksRepository.findById(6)).thenReturn(Optional.of(livreDisponible));
        when(usersRepository.findById(2)).thenReturn(Optional.of(adherent));

        ReservationRequest req = new ReservationRequest();
        req.setLivreId(6);
        req.setAdherentId(2);
        assertThrows(RuleViolationException.class, () -> reservationService.createReservation(req));
    }

    @Test
    void RG_01_reserverLivreIndisponible_ok() {
        when(booksRepository.findById(7)).thenReturn(Optional.of(livreIndisponible));
        when(usersRepository.findById(2)).thenReturn(Optional.of(adherent));
        when(reservationRepository.countByAdherent_UserIdAndLivre_BookIdAndStatutIn(2, 7, List.of(ReservationStatut.EN_ATTENTE, ReservationStatut.DISPONIBLE)))
                .thenReturn(0L);
        when(reservationRepository.countByAdherent_UserIdAndStatutIn(2, List.of(ReservationStatut.EN_ATTENTE, ReservationStatut.DISPONIBLE)))
                .thenReturn(0L);

        Reservation saved = new Reservation();
        saved.setReservationId(1);
        saved.setLivre(livreIndisponible);
        saved.setAdherent(adherent);
        saved.setStatut(ReservationStatut.EN_ATTENTE);
        saved.setDateReservation(new Date());
        saved.setDateExpiration(new Date());
        when(reservationRepository.save(any())).thenReturn(saved);

        ReservationResponse resp = reservationService.createReservation(requestValid);
        assertNotNull(resp);
        assertEquals(ReservationStatut.EN_ATTENTE, resp.getStatut());
    }

    // --- RG-02 : doublon même livre → 409 ---

    @Test
    void RG_02_doublonMemeLivre_throws409() {
        when(booksRepository.findById(7)).thenReturn(Optional.of(livreIndisponible));
        when(usersRepository.findById(2)).thenReturn(Optional.of(adherent));
        when(reservationRepository.countByAdherent_UserIdAndLivre_BookIdAndStatutIn(2, 7, List.of(ReservationStatut.EN_ATTENTE, ReservationStatut.DISPONIBLE)))
                .thenReturn(1L);

        assertThrows(RuleViolationException.class, () -> reservationService.createReservation(requestValid));
    }

    // --- RG-03 : max 3 réservations actives → 409 ---

    @Test
    void RG_03_quotaAtteint_throws409() {
        when(booksRepository.findById(7)).thenReturn(Optional.of(livreIndisponible));
        when(usersRepository.findById(2)).thenReturn(Optional.of(adherent));
        when(reservationRepository.countByAdherent_UserIdAndLivre_BookIdAndStatutIn(2, 7, List.of(ReservationStatut.EN_ATTENTE, ReservationStatut.DISPONIBLE)))
                .thenReturn(0L);
        when(reservationRepository.countByAdherent_UserIdAndStatutIn(2, List.of(ReservationStatut.EN_ATTENTE, ReservationStatut.DISPONIBLE)))
                .thenReturn(3L);

        RuleViolationException ex = assertThrows(RuleViolationException.class,
                () -> reservationService.createReservation(requestValid));
        assertTrue(ex.getMessage().contains("RG-03"));
    }

    @Test
    void RG_03_quotaNonAtteint_ok() {
        when(booksRepository.findById(7)).thenReturn(Optional.of(livreIndisponible));
        when(usersRepository.findById(2)).thenReturn(Optional.of(adherent));
        when(reservationRepository.countByAdherent_UserIdAndLivre_BookIdAndStatutIn(2, 7, List.of(ReservationStatut.EN_ATTENTE, ReservationStatut.DISPONIBLE)))
                .thenReturn(0L);
        when(reservationRepository.countByAdherent_UserIdAndStatutIn(2, List.of(ReservationStatut.EN_ATTENTE, ReservationStatut.DISPONIBLE)))
                .thenReturn(2L);

        Reservation saved = new Reservation();
        saved.setReservationId(1);
        saved.setLivre(livreIndisponible);
        saved.setAdherent(adherent);
        saved.setStatut(ReservationStatut.EN_ATTENTE);
        saved.setDateReservation(new Date());
        saved.setDateExpiration(new Date());
        when(reservationRepository.save(any())).thenReturn(saved);

        ReservationResponse resp = reservationService.createReservation(requestValid);
        assertNotNull(resp);
    }

    // --- RG-05 : annuler EN_ATTENTE → 200, ANNULEE → 409 ---

    @Test
    void RG_05_annulerEnAttente_ok() {
        Reservation resa = new Reservation();
        resa.setReservationId(1);
        resa.setStatut(ReservationStatut.EN_ATTENTE);
        resa.setLivre(livreIndisponible);
        resa.setAdherent(adherent);

        when(reservationRepository.findById(1)).thenReturn(Optional.of(resa));
        when(reservationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ReservationResponse resp = reservationService.annulerReservation(1);
        assertEquals(ReservationStatut.ANNULEE, resp.getStatut());
    }

    // --- RG-06 : annuler ANNULEE → 409 ---

    @Test
    void RG_06_annulerStatutTerminal_throws409() {
        Reservation resa = new Reservation();
        resa.setReservationId(1);
        resa.setStatut(ReservationStatut.ANNULEE);

        when(reservationRepository.findById(1)).thenReturn(Optional.of(resa));

        assertThrows(RuleViolationException.class, () -> reservationService.annulerReservation(1));
    }

    @Test
    void RG_06_honorerStatutTerminal_throws409() {
        Reservation resa = new Reservation();
        resa.setReservationId(1);
        resa.setStatut(ReservationStatut.ANNULEE);

        when(reservationRepository.findById(1)).thenReturn(Optional.of(resa));

        assertThrows(RuleViolationException.class, () -> reservationService.honorer(1));
    }
}
