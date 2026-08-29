export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const ENDPOINTS = {
  AUTH: `${API_BASE_URL}/authenticate`,
  BOOKS: `${API_BASE_URL}/admin/books`,
  USERS: `${API_BASE_URL}/admin/users`,
  RESERVATIONS: `${API_BASE_URL}/api/reservations`,
  BORROW: `${API_BASE_URL}/borrow`,
} as const;
