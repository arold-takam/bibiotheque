import apiClient from './apiClient';
import type { Book } from '../models/types';
import { ENDPOINTS } from '../config/api';

export const booksService = {
  async getAll(): Promise<Book[]> {
    const { data } = await apiClient.get<Book[]>(ENDPOINTS.BOOKS);
    return data;
  },

  async getById(id: number): Promise<Book> {
    const { data } = await apiClient.get<Book>(`${ENDPOINTS.BOOKS}/${id}`);
    return data;
  },

  async create(book: Partial<Book>): Promise<Book> {
    const { data } = await apiClient.post<Book>(ENDPOINTS.BOOKS, book);
    return data;
  },

  async update(id: number, book: Partial<Book>): Promise<Book> {
    const { data } = await apiClient.put<Book>(`${ENDPOINTS.BOOKS}/${id}`, book);
    return data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`${ENDPOINTS.BOOKS}/${id}`);
  },
};
