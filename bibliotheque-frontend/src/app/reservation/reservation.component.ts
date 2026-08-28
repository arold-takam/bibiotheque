import { Component, OnInit } from '@angular/core';
import { Books } from '../_model/books';
import { Reservation } from '../_model/reservation';
import { BooksService } from '../_service/books.service';
import { ReservationService } from '../_service/reservation.service';
import { UserAuthService } from '../_service/user-auth.service';

@Component({
  selector: 'app-reservation',
  templateUrl: './reservation.component.html',
  styleUrls: ['./reservation.component.css']
})
export class ReservationComponent implements OnInit {

  books: Books[] = [];
  reservations: Reservation[] = [];
  userId = this.userAuthService.getUserId();
  message = '';

  constructor(
    private booksService: BooksService,
    private reservationService: ReservationService,
    private userAuthService: UserAuthService,
  ) { }

  ngOnInit(): void {
    this.getBooks();
    this.loadReservations();
  }

  private getBooks() {
    this.booksService.getBooksList().subscribe(data => {
      this.books = data;
    });
  }

  private loadReservations() {
    this.reservationService.getReservationsByAdherent(this.userId).subscribe(data => {
      this.reservations = data;
    });
  }

  reserve(bookId: number) {
    this.message = '';
    this.reservationService.reserve({ livreId: bookId, adherentId: this.userId }).subscribe(
      data => {
        this.message = 'Réservation créée (statut ' + data.statut + ')';
        this.loadReservations();
      },
      error => this.message = 'Erreur : ' + (error.error || error)
    );
  }

  annuler(reservationId: number) {
    this.reservationService.annuler(reservationId).subscribe(
      () => this.loadReservations(),
      error => this.message = 'Erreur : ' + (error.error || error)
    );
  }
}