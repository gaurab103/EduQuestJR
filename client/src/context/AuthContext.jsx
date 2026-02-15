import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth as authApi } from '../api/client';

const AuthContext = createContext(null);

const TOKEN_KEY = 'eduquest_token';
const USER_KEY = 'eduquest_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const saved = localStorage.getItem(USER_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (_) {}
    }
    authApi
      .me()
      .then(({ user }) => {
        setUser(user);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { user, token } = await authApi.login({ email, password });
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setUser(user);
    return user;
  };

  const register = async (name, email, password) => {
    const { user, token } = await authApi.register({ name, email, password });
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const { user: u } = await authApi.me();
      setUser(u);
      localStorage.setItem(USER_KEY, JSON.stringify(u));
      return u;
    } catch (_) {
      return null;
    }
  };

  const value = { user, loading, login, register, logout, refreshUser, isAuthenticated: !!user };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
