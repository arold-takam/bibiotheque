export interface Role {
  roleId: number;
  roleName: string;
}

export interface User {
  userId: number;
  username: string;
  name: string;
  password?: string;
  role: Role[];
}

export interface Book {
  bookId: number;
  bookName: string;
  bookAuthor: string;
  bookGenre: string;
  noOfCopies: number;
  disponible: boolean;
}

export interface Borrow {
  borrowId: number;
  bookId: number;
  userId: number;
  issueDate: string;
  dueDate: string;
  returnDate: string | null;
}

export interface Reservation {
  reservationId: number;
  livreId: number;
  livreName: string;
  adherentId: number;
  adherentName: string;
  dateReservation: string;
  dateExpiration: string;
  statut: 'EN_ATTENTE' | 'DISPONIBLE' | 'ANNULEE' | 'EXPIREE' | 'HONOREE';
}

export interface ReservationRequest {
  livreId: number;
  adherentId: number;
}

export interface JwtResponse {
  jwtToken: string;
  user: User;
}

export type ReservationStatut =
  | 'TOUS'
  | 'EN_ATTENTE'
  | 'DISPONIBLE'
  | 'ANNULEE'
  | 'EXPIREE'
  | 'HONOREE';
