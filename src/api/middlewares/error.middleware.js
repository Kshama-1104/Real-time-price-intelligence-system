const logger = require('../../core/logger');
const responseUtil = require('../../utils/response.util');

const errorMiddleware = (err, req, res, _next) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json(
    responseUtil.error(message, statusCode, {
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    })
  );
};

module.exports = errorMiddleware;

