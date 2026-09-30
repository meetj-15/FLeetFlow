import { formatErrorResponse, AppError } from '../utils/errors.js';

/**
 * Global error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    code: err.code,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Handle AppError instances
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(formatErrorResponse(err));
  }

  // Format and send error response
  const errorResponse = formatErrorResponse(err);
  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler for undefined routes
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
};
