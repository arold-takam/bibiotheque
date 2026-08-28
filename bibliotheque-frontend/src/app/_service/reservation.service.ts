import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Reservation } from '../_model/reservation';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {

  private baseURL = "http://localhost:8080/api/reservations";

  constructor(private httpClient: HttpClient) { }

  getReservations(): Observable<Reservation[]> {
    return this.httpClient.get<Reservation[]>(`${this.baseURL}`);
  }

  getReservationsByAdherent(adherentId: number): Observable<Reservation[]> {
    return this.httpClient.get<Reservation[]>(`${this.baseURL}?adherentId=${adherentId}`);
  }

  reserve(payload: { livreId: number, adherentId: number }): Observable<Reservation> {
    return this.httpClient.post<Reservation>(`${this.baseURL}`, payload);
  }

  annuler(reservationId: number): Observable<Reservation> {
    return this.httpClient.patch<Reservation>(`${this.baseURL}/${reservationId}/annuler`, {});
  }
}