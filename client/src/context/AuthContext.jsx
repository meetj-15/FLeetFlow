import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { handleApiError } from '../services/api';

// ---------------------------------------------------------------------------
// Storage helpers — sessionStorage so credentials are cleared when the
// browser tab is closed (unlike localStorage which persists forever).
// ---------------------------------------------------------------------------
const storage = {
  get: (key) => sessionStorage.getItem(key),
  set: (key, val) => sessionStorage.setItem(key, val),
  remove: (key) => sessionStorage.removeItem(key),
  clear: () => sessionStorage.clear(),
};

// Also wipe any leftover localStorage tokens from old builds so they can't
// silently re-hydrate a session.
localStorage.removeItem('token');
localStorage.removeItem('user');

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // On mount: if a sessionStorage token exists verify it with the backend.
  // sessionStorage is wiped when the tab closes, so re-opening the URL
  // always starts unauthenticated.
  useEffect(() => {
    const checkAuth = async () => {
      const token = storage.get('token');

      if (token) {
        try {
          const response = await api.get('/auth/me');
          if (response.data.success) {
            setUser(response.data.data.user);
          } else {
            storage.clear();
            setUser(null);
          }
        } catch {
          // Token expired or server rejected it — force re-login
          storage.clear();
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await api.post('/auth/login', { email, password });

      if (response.data.success) {
        const { user, token } = response.data.data;
        storage.set('token', token);
        storage.set('user', JSON.stringify(user));
        setUser(user);
        return { success: true };
      }
    } catch (err) {
      const error = handleApiError(err);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const register = async (name, email, password, role) => {
    try {
      setError(null);
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
        role,
      });

      if (response.data.success) {
        const { user, token } = response.data.data;
        storage.set('token', token);
        storage.set('user', JSON.stringify(user));
        setUser(user);
        return { success: true };
      }
    } catch (err) {
      const error = handleApiError(err);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    storage.clear();
    setUser(null);
    window.location.href = '/login';
  };

  const hasRole = (allowedRoles) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    hasRole,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
