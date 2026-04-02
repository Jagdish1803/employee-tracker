const { getRedisClient } = require('../config/redis');
const logger = require('../config/logger');

const CACHE_TTL = 3600; // 1 hour

/**
 * Build cache key for SERP results
 */
function buildSerpCacheKey(keyword, location, device) {
  const normalizedKeyword = keyword.toLowerCase().replace(/\s+/g, '_');
  return `serp:${normalizedKeyword}:${location}:${device}`;
}

/**
 * Get cached SERP results
 */
async function getCachedSerpResults(keyword, location, device) {
  try {
    const redis = getRedisClient();
    const key = buildSerpCacheKey(keyword, location, device);
    const cached = await redis.get(key);

    if (cached) {
      logger.info({ key }, 'Cache HIT for SERP results');
      return JSON.parse(cached);
    }

    logger.debug({ key }, 'Cache MISS for SERP results');
    return null;
  } catch (err) {
    logger.error({ err }, 'Cache get error');
    return null;
  }
}

/**
 * Cache SERP results
 */
async function cacheSerpResults(keyword, location, device, results) {
  try {
    const redis = getRedisClient();
    const key = buildSerpCacheKey(keyword, location, device);
    await redis.setex(key, CACHE_TTL, JSON.stringify(results));
    logger.debug({ key, ttl: CACHE_TTL }, 'SERP results cached');
  } catch (err) {
    logger.error({ err }, 'Cache set error');
  }
}

module.exports = { getCachedSerpResults, cacheSerpResults, buildSerpCacheKey };
