require('dotenv').config();
const { httpServer } = require('./app');
const logger = require('./core/logger');
const env = require('./config/env');
const db = require('./database/pool');
const cache = require('./cache/redis');

const PORT = env.port;
const NODE_ENV = env.nodeEnv;

const shutdown = (signal) => {
  logger.info(`${signal} signal received: closing HTTP server`);
  httpServer.close(async () => {
    await Promise.allSettled([db.close(), cache.close()]);
    logger.info('HTTP server closed');
    process.exit(0);
  });
};

// Start server
httpServer.listen(PORT, () => {
  logger.info(`Server running in ${NODE_ENV} mode on port ${PORT}`);
  logger.info(`API available at http://localhost:${PORT}/api/v1`);
});

// Graceful shutdown
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  httpServer.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = httpServer;

