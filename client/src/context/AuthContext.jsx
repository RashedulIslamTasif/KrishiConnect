import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true); // true while checking localStorage

  // On app load, restore user from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('krishi_user');
    const token  = localStorage.getItem('krishi_token');
    if (stored && token) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  // ── Login ──────────────────────────────────────────────────
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('krishi_token', data.token);
    localStorage.setItem('krishi_user',  JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  // ── Register ───────────────────────────────────────────────
  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    localStorage.setItem('krishi_token', data.token);
    localStorage.setItem('krishi_user',  JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  // ── Logout ─────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('krishi_token');
    localStorage.removeItem('krishi_user');
    setUser(null);
  };

  // ── Refresh user from server ───────────────────────────────
  const refreshUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      localStorage.setItem('krishi_user', JSON.stringify(data.user));
    } catch {
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy access
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
