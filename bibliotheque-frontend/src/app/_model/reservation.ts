export interface Reservation {
  reservationId: number;
  livreId: number;
  livreName: string;
  adherentId: number;
  adherentName: string;
  dateReservation: Date;
  dateExpiration: Date;
  statut: string;
}
