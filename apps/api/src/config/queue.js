const { Queue } = require('bullmq');
const { getRedisClient } = require('./redis');
const { QUEUE_NAMES } = require('../../../packages/shared/constants');
const logger = require('./logger');

const queues = {};

function getQueue(name) {
  if (!queues[name]) {
    queues[name] = new Queue(name, {
      connection: getRedisClient(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 200 },
      },
    });

    queues[name].on('error', (err) => logger.error({ err, queue: name }, 'Queue error'));
  }
  return queues[name];
}

function getRankCheckQueue() {
  return getQueue(QUEUE_NAMES.RANK_CHECK);
}

async function closeQueues() {
  await Promise.all(Object.values(queues).map((q) => q.close()));
}

module.exports = { getQueue, getRankCheckQueue, closeQueues };
