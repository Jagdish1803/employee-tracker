const { getPrismaClient } = require('../config/database');
const { getRedisClient } = require('../config/redis');
const { successResponse } = require('../utils/response');
const logger = require('../config/logger');

async function healthCheck(req, res) {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {},
  };

  // Check database
  try {
    const prisma = getPrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    checks.services.database = { status: 'ok' };
  } catch (err) {
    checks.services.database = { status: 'error', message: err.message };
    checks.status = 'degraded';
  }

  // Check Redis
  try {
    const redis = getRedisClient();
    await redis.ping();
    checks.services.redis = { status: 'ok' };
  } catch (err) {
    checks.services.redis = { status: 'error', message: err.message };
    checks.status = 'degraded';
  }

  const statusCode = checks.status === 'ok' ? 200 : 503;
  return res.status(statusCode).json(checks);
}

async function readinessCheck(req, res) {
  return successResponse(res, { ready: true });
}

module.exports = { healthCheck, readinessCheck };
