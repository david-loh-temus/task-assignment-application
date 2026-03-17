import { Kysely, PostgresDialect, sql } from 'kysely';
import type { PostgresDialectConfig } from 'kysely';
import { Pool } from 'pg';

import config from '../config/config';
import logger from '../lib/logger';

export interface Database {}

const pool = new Pool({
  connectionString: config.db.url,
});

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: pool as unknown as PostgresDialectConfig['pool'],
  }),
});

export async function connectToDatabase(): Promise<void> {
  if (!config.db.url) {
    const error = new Error('DATABASE_URL is not configured');

    logger.error({ err: error }, 'Failed to connect to database');

    throw error;
  }

  try {
    await sql`select 1`.execute(db);
    logger.info('Database connection established');
  } catch (error) {
    logger.error({ err: error }, 'Failed to connect to database');
    throw error;
  }
}

export async function disconnectFromDatabase(): Promise<void> {
  try {
    await db.destroy();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error({ err: error }, 'Failed to close database connection');
    throw error;
  }
}
