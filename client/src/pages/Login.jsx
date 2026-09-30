import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRoles } from '../utils/constants';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, register, isAuthenticated } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: UserRoles.FLEET_MANAGER,
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      if (isSignUp) {
        result = await register(formData.name, formData.email, formData.password, formData.role);
      } else {
        result = await login(formData.email, formData.password);
      }

      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'Authentication failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-logo">🚚 FleetFlow</h1>
          <p className="login-subtitle">Transport Operations Management</p>
        </div>

        <div className="login-tabs">
          <button
            className={`tab ${!isSignUp ? 'active' : ''}`}
            onClick={() => {
              setIsSignUp(false);
              setError('');
            }}
          >
            Sign In
          </button>
          <button
            className={`tab ${isSignUp ? 'active' : ''}`}
            onClick={() => {
              setIsSignUp(true);
              setError('');
            }}
          >
            Sign Up
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {isSignUp && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              minLength={8}
            />
          </div>

          {isSignUp && (
            <div className="form-group">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                {Object.values(UserRoles).map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <div className="login-demo-info">
          <p><strong>Demo Credentials:</strong></p>
          <p>Email: manager@fleetflow.com | Password: password123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
