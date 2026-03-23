import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/apiService';

const AuthContext = createContext(null);

/**
 * AuthProvider
 * Manages JWT token + user state globally.
 * - Persists to localStorage
 * - Validates token on mount
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while checking existing session

  // On mount: restore session from localStorage
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('hostel_token');
      const saved = localStorage.getItem('hostel_user');
      if (token && saved) {
        try {
          // Validate token is still good
          const res = await authAPI.getMe();
          setUser(res.data.user);
        } catch {
          // Token expired or invalid – clear it
          localStorage.removeItem('hostel_token');
          localStorage.removeItem('hostel_user');
        }
      }
      setLoading(false);
    };
    restoreSession();
  }, []);

  const login = useCallback((token, userData) => {
    localStorage.setItem('hostel_token', token);
    localStorage.setItem('hostel_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('hostel_token');
    localStorage.removeItem('hostel_user');
    setUser(null);
  }, []);

  const value = { user, login, logout, loading, isAdmin: user?.role === 'admin' };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
