import { validationResult } from 'express-validator';
import { validationError } from '../utils/errors.js';

/**
 * Middleware to check validation results
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }));

    throw validationError('Validation failed', errorDetails);
  }
  
  next();
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
