require('dotenv').config();

const { Worker, QueueEvents } = require('bullmq');
const { getRedisClient, disconnectRedis } = require('./config/redis');
const { disconnectPrisma } = require('./config/database');
const { processRankCheck } = require('./processors/rankCheck.processor');
const { QUEUE_NAMES } = require('../../../../packages/shared/constants');
const logger = require('./config/logger');

const WORKER_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '2', 10);

let worker;

async function start() {
  logger.info({ concurrency: WORKER_CONCURRENCY }, 'Starting SEO Rank Checker Worker');

  const connection = getRedisClient();

  worker = new Worker(
    QUEUE_NAMES.RANK_CHECK,
    async (job) => {
      logger.info({ jobId: job.id, data: job.data }, 'Processing job');
      return processRankCheck(job);
    },
    {
      connection,
      concurrency: WORKER_CONCURRENCY,
      limiter: {
        max: parseInt(process.env.WORKER_MAX_JOBS_PER_MINUTE || '10', 10),
        duration: 60000,
      },
    }
  );

  worker.on('completed', (job, result) => {
    logger.info(
      { jobId: job.id, checkId: result.checkId, position: result.currentPosition },
      'Job completed'
    );
  });

  worker.on('failed', (job, err) => {
    logger.error(
      { jobId: job?.id, error: err.message, attempts: job?.attemptsMade },
      'Job failed'
    );
  });

  worker.on('progress', (job, progress) => {
    logger.debug({ jobId: job.id, progress }, 'Job progress');
  });

  worker.on('error', (err) => {
    logger.error({ err }, 'Worker error');
  });

  // Queue events for monitoring
  const queueEvents = new QueueEvents(QUEUE_NAMES.RANK_CHECK, { connection });

  queueEvents.on('stalled', ({ jobId }) => {
    logger.warn({ jobId }, 'Job stalled');
  });

  logger.info('Worker started and waiting for jobs...');
}

async function shutdown(signal) {
  logger.info({ signal }, 'Shutting down worker...');

  try {
    if (worker) {
      await worker.close();
    }
    await disconnectRedis();
    await disconnectPrisma();
    logger.info('Worker shutdown complete');
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error during worker shutdown');
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start().catch((err) => {
  logger.error({ err }, 'Failed to start worker');
  process.exit(1);
});
