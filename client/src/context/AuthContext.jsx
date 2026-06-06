import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

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

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('krishi_token', data.token);
    // Fetch full user immediately so avatar and all fields are fresh from DB
    try {
      const { data: meData } = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${data.token}` }
      });
      const freshUser = meData.user || meData;
      localStorage.setItem('krishi_user', JSON.stringify(freshUser));
      setUser(freshUser);
      return freshUser;
    } catch {
      localStorage.setItem('krishi_user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    }
  };

  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    localStorage.setItem('krishi_token', data.token);
    localStorage.setItem('krishi_user',  JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('krishi_token');
    localStorage.removeItem('krishi_user');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      const freshUser = (data && typeof data === 'object' && data.user) ? data.user : data;
      if (freshUser && freshUser._id) {
        const existing = user || {};
        const safeUser = {
          ...freshUser,
          avatar: freshUser.avatar || existing.avatar || '',
        };
        localStorage.setItem('krishi_user', JSON.stringify(safeUser));
        setUser(safeUser);
        return safeUser;
      }
    } catch {
      // keep existing user
    }
    return null;
  };

  const updateUser = (updatedUser) => {
    const existing = user || {};
    const merged = {
      ...existing,
      ...updatedUser,
      avatar: updatedUser.avatar || existing.avatar || '',
    };
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