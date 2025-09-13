// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create a single instance with optimized settings for performance
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  // Optimize connection pool for better performance
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Add performance optimizations
  errorFormat: 'minimal',
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Connection management with better error handling
let connectionPromise: Promise<void> | null = null;

export async function ensureConnection() {
  // If there's already a connection attempt in progress, wait for it
  if (connectionPromise) {
    return connectionPromise;
  }

  // Create a new connection promise
  connectionPromise = (async () => {
    try {
      // Test the connection with a simple query (faster than $connect)
      await prisma.$queryRaw`SELECT 1`;
      
      console.log('✅ Database connection verified');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      connectionPromise = null; // Reset on failure so we can retry
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  })();

  return connectionPromise;
}

export async function connectDB() {
  return ensureConnection();
}

// Only disconnect on app shutdown, not on every request
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });

  process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

