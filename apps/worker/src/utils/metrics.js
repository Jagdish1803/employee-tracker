/**
 * Worker metrics tracking
 */
const metrics = {
  jobsProcessed: 0,
  jobsSucceeded: 0,
  jobsFailed: 0,
  cacheHits: 0,
  cacheMisses: 0,
  startTime: Date.now(),
};

function incrementJobsProcessed() {
  metrics.jobsProcessed++;
}

function incrementJobsSucceeded() {
  metrics.jobsSucceeded++;
}

function incrementJobsFailed() {
  metrics.jobsFailed++;
}

function incrementCacheHit() {
  metrics.cacheHits++;
}

function incrementCacheMiss() {
  metrics.cacheMisses++;
}

function getMetrics() {
  const uptimeSeconds = Math.round((Date.now() - metrics.startTime) / 1000);
  return {
    ...metrics,
    uptimeSeconds,
    successRate:
      metrics.jobsProcessed > 0
        ? ((metrics.jobsSucceeded / metrics.jobsProcessed) * 100).toFixed(1)
        : 0,
    cacheHitRate:
      metrics.cacheHits + metrics.cacheMisses > 0
        ? ((metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100).toFixed(1)
        : 0,
  };
}

module.exports = {
  incrementJobsProcessed,
  incrementJobsSucceeded,
  incrementJobsFailed,
  incrementCacheHit,
  incrementCacheMiss,
  getMetrics,
};
