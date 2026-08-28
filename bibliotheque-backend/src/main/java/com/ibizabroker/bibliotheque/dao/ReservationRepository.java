package com.ibizabroker.bibliotheque.dao;

import com.ibizabroker.bibliotheque.entity.Reservation;
import com.ibizabroker.bibliotheque.entity.ReservationStatut;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Date;
import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Integer> {

    List<Reservation> findByStatut(ReservationStatut statut);

    List<Reservation> findByAdherent_UserId(Integer adherentId);

    List<Reservation> findByAdherent_UserIdAndStatut(Integer adherentId, ReservationStatut statut);

    List<Reservation> findByAdherent_UserIdAndStatutIn(Integer adherentId, Collection<ReservationStatut> statuts);

    long countByAdherent_UserIdAndStatutIn(Integer adherentId, Collection<ReservationStatut> statuts);

    long countByAdherent_UserIdAndLivre_BookIdAndStatutIn(
            Integer adherentId, Integer bookId, Collection<ReservationStatut> statuts);

    List<Reservation> findByDateExpirationBeforeAndStatut(Date date, ReservationStatut statut);

    Reservation findFirstByLivre_BookIdAndStatutOrderByDateReservationAsc(Integer bookId, ReservationStatut statut);
}
