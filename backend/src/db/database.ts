import { PrismaClient } from '@prisma/client';

import config from '../config/config';
import logger from '../lib/logger';

export const db = new PrismaClient({
  log: config.nodeEnv === 'development' ? ['warn', 'error'] : ['error'],
});

export async function connectToDatabase(): Promise<void> {
  if (!config.db.url) {
    const error = new Error('DATABASE_URL is not configured');

    logger.error({ err: error }, 'Failed to connect to database');

    throw error;
  }

  try {
    await db.$connect();
    await db.$queryRaw`SELECT 1`;
    logger.info('Database connection established');
  } catch (error) {
    logger.error({ err: error }, 'Failed to connect to database');
    throw error;
  }
}

export async function disconnectFromDatabase(): Promise<void> {
  try {
    await db.$disconnect();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error({ err: error }, 'Failed to close database connection');
    throw error;
  }
}
