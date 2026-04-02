require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const pinoHttp = require('pino-http');
const { getPrismaClient, disconnectPrisma } = require('./config/database');
const { getRedisClient, disconnectRedis } = require('./config/redis');
const { closeQueues } = require('./config/queue');
const corsMiddleware = require('./middleware/cors');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');
const logger = require('./config/logger');

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Security middleware
app.use(helmet());
app.use(corsMiddleware);

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// Request logging
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          method: req.method,
          url: req.url,
          ip: req.remoteAddress,
        };
      },
    },
  })
);

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// API routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

// Start server
async function start() {
  try {
    // Verify database connection
    const prisma = getPrismaClient();
    await prisma.$connect();
    logger.info('Database connected');

    // Verify Redis connection
    const redis = getRedisClient();
    await redis.connect().catch(() => {}); // Already connected if no error
    logger.info('Redis connected');

    app.listen(PORT, () => {
      logger.info({ port: PORT, env: process.env.NODE_ENV }, 'SEO Rank Checker API started');
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown(signal) {
  logger.info({ signal }, 'Shutting down...');
  try {
    await closeQueues();
    await disconnectRedis();
    await disconnectPrisma();
    logger.info('Graceful shutdown complete');
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error during shutdown');
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();

module.exports = app;
