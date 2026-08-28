import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Reservation } from '../_model/reservation';

@Injectable({ providedIn: 'root' })
export class ReservationService {

  private baseURL = 'http://localhost:8080/api/reservations';

  constructor(private httpClient: HttpClient) { }

  getReservations(statut?: string): Observable<Reservation[]> {
    let params = new HttpParams();
    if (statut && statut !== 'TOUS') {
      params = params.set('statut', statut);
    }
    return this.httpClient.get<Reservation[]>(this.baseURL, { params });
  }

  getReservationById(id: number): Observable<Reservation> {
    return this.httpClient.get<Reservation>(`${this.baseURL}/${id}`);
  }

  createReservation(payload: { livreId: number; adherentId: number }): Observable<Reservation> {
    return this.httpClient.post<Reservation>(this.baseURL, payload);
  }

  annulerReservation(id: number): Observable<Reservation> {
    return this.httpClient.patch<Reservation>(`${this.baseURL}/${id}/annuler`, {});
  }
}
