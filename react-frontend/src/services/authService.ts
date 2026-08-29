import apiClient from './apiClient';
import type { JwtResponse } from '../models/types';

export const authService = {
  async login(username: string, password: string): Promise<JwtResponse> {
    const { data } = await apiClient.post<JwtResponse>('/authenticate', { username, password });
    localStorage.setItem('jwtToken', data.jwtToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  logout() {
    localStorage.clear();
    window.location.href = '/login';
  },

  getToken(): string | null {
    return localStorage.getItem('jwtToken');
  },

  getUser() {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  },

  isLoggedIn(): boolean {
    return !!this.getToken();
  },

  hasRole(role: string): boolean {
    const user = this.getUser();
    return user?.role?.some((r: any) => r.roleName === role) ?? false;
  },
};
