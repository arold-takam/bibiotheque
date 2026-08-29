import apiClient from './apiClient';
import type { Reservation, ReservationRequest } from '../models/types';
import { ENDPOINTS } from '../config/api';

export const reservationService = {
  async getAll(statut?: string, adherentId?: number): Promise<Reservation[]> {
    const params = new URLSearchParams();
    if (statut && statut !== 'TOUS') params.set('statut', statut);
    if (adherentId) params.set('adherentId', String(adherentId));
    const { data } = await apiClient.get<Reservation[]>(ENDPOINTS.RESERVATIONS, { params });
    return data;
  },

  async create(payload: ReservationRequest): Promise<Reservation> {
    const { data } = await apiClient.post<Reservation>(ENDPOINTS.RESERVATIONS, payload);
    return data;
  },

  async cancel(id: number): Promise<Reservation> {
    const { data } = await apiClient.patch<Reservation>(`${ENDPOINTS.RESERVATIONS}/${id}/annuler`);
    return data;
  },

  // Transitions de statut (update réservation) : PUT /{id}/disponible, /{id}/honorer
  async markDisponible(id: number): Promise<Reservation> {
    const { data } = await apiClient.put<Reservation>(`${ENDPOINTS.RESERVATIONS}/${id}/disponible`);
    return data;
  },

  async markHonoree(id: number): Promise<Reservation> {
    const { data } = await apiClient.put<Reservation>(`${ENDPOINTS.RESERVATIONS}/${id}/honorer`);
    return data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`${ENDPOINTS.RESERVATIONS}/${id}`);
  },
};
