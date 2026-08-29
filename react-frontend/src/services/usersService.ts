import apiClient from './apiClient';
import type { User } from '../models/types';
import { ENDPOINTS } from '../config/api';

export const usersService = {
  async getAll(): Promise<User[]> {
    const { data } = await apiClient.get<User[]>(ENDPOINTS.USERS);
    return data;
  },

  async getById(id: number): Promise<User> {
    const { data } = await apiClient.get<User>(`${ENDPOINTS.USERS}/${id}`);
    return data;
  },

  async create(user: Partial<User>): Promise<User> {
    const { data } = await apiClient.post<User>(ENDPOINTS.USERS, user);
    return data;
  },

  async update(id: number, user: Partial<User>): Promise<User> {
    const { data } = await apiClient.put<User>(`${ENDPOINTS.USERS}/${id}`, user);
    return data;
  },
};
