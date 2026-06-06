import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // ── On app load, restore user from localStorage ──────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem('krishi_user');
      if (stored) setUser(JSON.parse(stored));
    } catch {
      localStorage.removeItem('krishi_user');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Login ────────────────────────────────────────────────────
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('krishi_token', data.token);
    localStorage.setItem('krishi_user',  JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  // ── Register ─────────────────────────────────────────────────
  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    localStorage.setItem('krishi_token', data.token);
    localStorage.setItem('krishi_user',  JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  // ── Logout ───────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('krishi_token');
    localStorage.removeItem('krishi_user');
    setUser(null);
  };

  // ── Refresh user from server ─────────────────────────────────
  // FIX: Never logs out on failure — only updates state if the
  // request succeeds. This prevents a failed /auth/me (e.g. 404,
  // network blip) from wiping the user and causing a white screen.
  const refreshUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      // Handle both { user: {...} } and plain user object shapes
      const freshUser = (data && typeof data === 'object' && data.user) ? data.user : data;
      if (freshUser && freshUser._id) {
        localStorage.setItem('krishi_user', JSON.stringify(freshUser));
        setUser(freshUser);
        return freshUser;
      }
    } catch {
      // Silently ignore — keep the existing user in state.
      // Only logout() if the token truly expired (401), not on any error.
    }
    return null;
  };

  // ── Update local user state directly (for instant UI updates) ─
  // Call this after any successful profile save to update state
  // without needing a round-trip if the server already returned
  // the updated user object.
  const updateUser = (updatedUser) => {
    const merged = { ...user, ...updatedUser };
    localStorage.setItem('krishi_user', JSON.stringify(merged));
    setUser(merged);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};