import jwt from 'jsonwebtoken';
import { unauthorizedError, forbiddenError } from '../utils/errors.js';
import { query } from '../config/db.js';

/**
 * Verify JWT token and attach user to request
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw unauthorizedError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw unauthorizedError('Token expired');
      }
      throw unauthorizedError('Invalid token');
    }

    // Fetch user from database
    const result = await query(
      'SELECT id, name, email, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      throw unauthorizedError('User not found');
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw forbiddenError('Account is inactive');
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Authorize based on user roles
 * @param {string[]} allowedRoles - Array of roles that can access the route
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw unauthorizedError('Authentication required');
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw forbiddenError(`Access denied. Required role: ${allowedRoles.join(' or ')}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Optional authentication - attaches user if token is present but doesn't fail if missing
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const result = await query(
          'SELECT id, name, email, role, is_active FROM users WHERE id = $1',
          [decoded.userId]
        );

        if (result.rows.length > 0 && result.rows[0].is_active) {
          req.user = result.rows[0];
        }
      } catch (error) {
        // Silently continue without user
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Generate JWT token
 */
export const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};
