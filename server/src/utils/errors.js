/**
 * Standard error codes for FleetFlow
 */
export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Business Rules
  VEHICLE_UNAVAILABLE: 'VEHICLE_UNAVAILABLE',
  DRIVER_UNAVAILABLE: 'DRIVER_UNAVAILABLE',
  LICENSE_EXPIRED: 'LICENSE_EXPIRED',
  CARGO_EXCEEDS_CAPACITY: 'CARGO_EXCEEDS_CAPACITY',
  INVALID_STATUS: 'INVALID_STATUS',
  VEHICLE_ON_TRIP: 'VEHICLE_ON_TRIP',
  DRIVER_SUSPENDED: 'DRIVER_SUSPENDED',
  RESOURCE_IN_USE: 'RESOURCE_IN_USE',
  
  // Resource
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  
  // System
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(code, message, statusCode = 400, details = null) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Create a validation error
 */
export const validationError = (message, details = null) => {
  return new AppError(ErrorCodes.VALIDATION_ERROR, message, 400, details);
};

/**
 * Create a not found error
 */
export const notFoundError = (resource = 'Resource') => {
  return new AppError(ErrorCodes.NOT_FOUND, `${resource} not found`, 404);
};

/**
 * Create an unauthorized error
 */
export const unauthorizedError = (message = 'Authentication required') => {
  return new AppError(ErrorCodes.UNAUTHORIZED, message, 401);
};

/**
 * Create a forbidden error
 */
export const forbiddenError = (message = 'Access denied') => {
  return new AppError(ErrorCodes.FORBIDDEN, message, 403);
};

/**
 * Create a business rule error
 */
export const businessRuleError = (code, message) => {
  return new AppError(code, message, 400);
};

/**
 * Create a database error
 */
export const databaseError = (message = 'Database operation failed', details = null) => {
  return new AppError(ErrorCodes.DATABASE_ERROR, message, 500, details);
};

/**
 * Format error response
 */
export const formatErrorResponse = (error) => {
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && { details: error.details }),
      },
    };
  }

  // Handle specific database errors
  if (error.code === '23505') { // Unique violation
    return {
      success: false,
      error: {
        code: ErrorCodes.DUPLICATE_ENTRY,
        message: 'A record with this value already exists',
        details: error.detail,
      },
    };
  }

  if (error.code === '23503') { // Foreign key violation
    return {
      success: false,
      error: {
        code: ErrorCodes.RESOURCE_IN_USE,
        message: 'Cannot delete: resource is referenced by other records',
        details: error.detail,
      },
    };
  }

  if (error.code === '23514') { // Check constraint violation
    return {
      success: false,
      error: {
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Data validation failed',
        details: error.detail,
      },
    };
  }

  // Generic error
  return {
    success: false,
    error: {
      code: ErrorCodes.INTERNAL_ERROR,
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : error.message,
    },
  };
};
