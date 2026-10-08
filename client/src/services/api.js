import axios from 'axios';

// Base API URL from environment variable or default to /api
const API_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Read from sessionStorage — clears automatically when tab is closed
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle 401 Unauthorized - token expired or invalid
      if (error.response.status === 401) {
        sessionStorage.clear();
        window.location.href = '/login';
      }
      
      // Extract error message from response
      const errorMessage = error.response.data?.error?.message || 'An error occurred';
      error.message = errorMessage;
    }
    
    return Promise.reject(error);
  }
);

export default api;

// Helper function to handle API errors consistently
export const handleApiError = (error) => {
  if (error.response?.data?.error) {
    return {
      message: error.response.data.error.message,
      code: error.response.data.error.code,
      details: error.response.data.error.details,
    };
  }
  return {
    message: error.message || 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
  };
};
