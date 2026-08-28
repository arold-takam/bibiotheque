import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { Reservation } from '../_model/reservation';

@Component({
  selector: 'app-reservation-list',
  templateUrl: './reservation-list.component.html',
  styleUrls: ['./reservation-list.component.css']
})
export class ReservationListComponent implements OnChanges {

  @Input() reservations: Reservation[] = [];
  @Input() loading = false;
  @Input() errorMessage = '';
  @Output() annuler = new EventEmitter<number>();

  filtreStatut = 'TOUS';
  statuts = ['TOUS', 'EN_ATTENTE', 'DISPONIBLE', 'ANNULEE', 'EXPIREE', 'HONOREE'];

  filteredReservations: Reservation[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reservations']) {
      this.applyFilter();
    }
  }

  onFiltreChange(): void {
    this.applyFilter();
  }

  private applyFilter(): void {
    if (this.filtreStatut === 'TOUS') {
      this.filteredReservations = this.reservations;
    } else {
      this.filteredReservations = this.reservations.filter(
        r => r.statut === this.filtreStatut
      );
    }
  }

  isAnnulable(statut: string): boolean {
    return statut === 'EN_ATTENTE' || statut === 'DISPONIBLE';
  }

  onAnnuler(id: number): void {
    this.annuler.emit(id);
  }

  formatDate(date: Date): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}
