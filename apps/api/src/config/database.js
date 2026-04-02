const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

let prisma;

function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: [
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' },
      ],
    });

    prisma.$on('warn', (e) => logger.warn({ msg: e.message }));
    prisma.$on('error', (e) => logger.error({ msg: e.message }));
  }
  return prisma;
}

async function disconnectPrisma() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

module.exports = { getPrismaClient, disconnectPrisma };
