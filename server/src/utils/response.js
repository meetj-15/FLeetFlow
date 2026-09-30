/**
 * Send successful response
 */
export const successResponse = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
  });
};

/**
 * Send error response
 */
export const errorResponse = (res, code, message, statusCode = 400, details = null) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  });
};

/**
 * Send created response
 */
export const createdResponse = (res, data) => {
  return successResponse(res, data, 201);
};

/**
 * Send no content response
 */
export const noContentResponse = (res) => {
  return res.status(204).send();
};
