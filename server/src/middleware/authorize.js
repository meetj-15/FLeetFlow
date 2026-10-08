/**
 * Authorization Middleware
 * Provides role-based access control (RBAC) enforcement
 */

import { forbiddenError } from '../utils/errors.js';

/**
 * Authorization middleware factory
 * Creates middleware that checks if user's role is in allowed roles
 * 
 * @param {string[]} allowedRoles - Array of roles permitted to access the endpoint
 * @returns {Function} Express middleware function
 * 
 * @example
 * router.post('/vehicles', authenticate, authorize(['Fleet Manager']), createVehicle);
 * router.get('/drivers', authenticate, authorize(['Fleet Manager', 'Safety Officer']), getAllDrivers);
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Ensure user is authenticated (should be set by authenticate middleware)
    if (!req.user) {
      return next(forbiddenError('Authentication required'));
    }

    // Extract user role
    const userRole = req.user.role;

    // Check if user's role is in the allowed roles
    if (!allowedRoles.includes(userRole)) {
      return next(
        forbiddenError(
          `Access denied. This action requires one of the following roles: ${allowedRoles.join(', ')}`
        )
      );
    }

    // User is authorized, proceed to next middleware
    next();
  };
};

/**
 * Helper function to check if a user has a specific role
 * Useful for conditional logic in controllers
 * 
 * @param {Object} user - User object with role property
 * @param {string[]} roles - Array of roles to check against
 * @returns {boolean} True if user has one of the specified roles
 */
export const hasRole = (user, ...roles) => {
  if (!user || !user.role) {
    return false;
  }
  return roles.includes(user.role);
};

/**
 * Helper function to get role-specific filter for database queries
 * Used to implement data isolation based on user role
 * 
 * @param {Object} user - User object with id and role
 * @returns {Object} Filter object with role-specific query parameters
 */
export const getRoleFilter = (user) => {
  const filters = {
    userId: user.id,
    userRole: user.role,
  };

  // Drivers can only see their own data
  if (user.role === 'Driver') {
    filters.restrictToUser = true;
  }

  return filters;
};

export default authorize;
