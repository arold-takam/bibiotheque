import { useState, useCallback } from 'react';
import { authService } from '../services/authService';
import type { User } from '../models/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(authService.getUser());
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    try {
      const res = await authService.login(username, password);
      setUser(res.user);
      return res;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const isLoggedIn = !!user;
  const isAdmin = user?.role?.some(r => r.roleName === 'Admin') ?? false;
  const isUser = user?.role?.some(r => r.roleName === 'User') ?? false;

  return { user, login, logout, isLoggedIn, isAdmin, isUser, loading };
}
