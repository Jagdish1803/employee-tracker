const logger = require('../config/logger');
const { errorResponse } = require('../utils/response');

function errorHandler(err, req, res, next) {
  logger.error(
    {
      err: {
        message: err.message,
        stack: err.stack,
        code: err.code,
      },
      req: {
        method: req.method,
        url: req.url,
        ip: req.ip,
      },
    },
    'Unhandled error'
  );

  if (err.name === 'ValidationError' || err.name === 'ZodError') {
    return errorResponse(res, 'Validation error', 400, err.errors || err.issues);
  }

  if (err.code === 'P2002') {
    return errorResponse(res, 'Resource already exists', 409);
  }

  if (err.code === 'P2025') {
    return errorResponse(res, 'Resource not found', 404);
  }

  const statusCode = err.statusCode || err.status || 500;
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal server error'
      : err.message || 'Internal server error';

  return errorResponse(res, message, statusCode);
}

module.exports = errorHandler;
