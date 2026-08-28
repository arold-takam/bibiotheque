import { Component, OnInit, ViewChild } from '@angular/core';
import { Reservation } from '../_model/reservation';
import { Books } from '../_model/books';
import { Users } from '../_model/users';
import { ReservationService } from '../_service/reservation.service';
import { BooksService } from '../_service/books.service';
import { UsersService } from '../_service/users.service';
import { ReservationFormComponent } from '../reservation-form/reservation-form.component';

@Component({
  selector: 'app-reservation',
  templateUrl: './reservation.component.html',
  styleUrls: ['./reservation.component.css']
})
export class ReservationComponent implements OnInit {

  @ViewChild(ReservationFormComponent) reservationForm!: ReservationFormComponent;

  allReservations: Reservation[] = [];
  loading = false;
  errorMessage = '';

  constructor(
    private reservationService: ReservationService
  ) { }

  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations(): void {
    this.loading = true;
    this.errorMessage = '';
    this.reservationService.getReservations().subscribe({
      next: (data) => {
        this.allReservations = data;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 0) {
          this.errorMessage = 'Le serveur est injoignable. Vérifiez que le backend est démarré.';
        } else {
          this.errorMessage = err.error?.message || 'Erreur lors du chargement des réservations.';
        }
      }
    });
  }

  onReservationCree(): void {
    if (!this.reservationForm) return;
    const livreId = this.reservationForm.selectedLivreId;
    const adherentId = this.reservationForm.selectedAdherentId;
    if (livreId === null || adherentId === null) return;

    this.reservationForm.loading = true;
    this.reservationForm.errorMessage = '';

    this.reservationService.createReservation({ livreId, adherentId }).subscribe({
      next: () => {
        this.reservationForm.loading = false;
        this.reservationForm.selectedLivreId = null;
        this.reservationForm.selectedAdherentId = null;
        this.loadReservations();
      },
      error: (err) => {
        this.reservationForm.loading = false;
        this.reservationForm.errorMessage = this.extractErrorMessage(err);
      }
    });
  }

  onAnnuler(id: number): void {
    if (!confirm('Voulez-vous vraiment annuler cette réservation ?')) return;

    this.reservationService.annulerReservation(id).subscribe({
      next: () => this.loadReservations(),
      error: (err) => {
        this.errorMessage = this.extractErrorMessage(err);
      }
    });
  }

  private extractErrorMessage(err: any): string {
    if (err.status === 0) {
      return 'Le serveur est injoignable.';
    }
    if (err.status === 409) {
      return err.error?.message || 'Conflit : règle de gestion violée.';
    }
    if (err.status === 400) {
      return err.error?.message || 'Requête invalide : champ manquant.';
    }
    if (err.status === 404) {
      return err.error?.message || 'Ressource introuvable.';
    }
    return err.error?.message || 'Une erreur est survenue.';
  }
}
