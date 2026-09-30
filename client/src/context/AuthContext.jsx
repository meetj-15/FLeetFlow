import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { handleApiError } from '../services/api';

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

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          // Optionally verify token with backend
          const response = await api.get('/auth/me');
          if (response.data.success) {
            setUser(response.data.data.user);
            localStorage.setItem('user', JSON.stringify(response.data.data.user));
          }
        } catch (err) {
          console.error('Auth check failed:', err);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
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
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
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
        role 
      });
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
