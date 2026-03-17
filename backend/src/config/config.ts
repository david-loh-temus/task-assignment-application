import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const DEFAULT_PORT = 4000;
const DEFAULT_LOG_LEVEL = 'info';
const PARSE_INT_RADIX = 10;

const nodeEnv = process.env.NODE_ENV ?? 'development';
const parsedPort = Number.parseInt(process.env.PORT ?? `${DEFAULT_PORT}`, PARSE_INT_RADIX);

const config = {
  db: {
    url: process.env.DATABASE_URL ?? '',
  },
  logLevel: process.env.LOG_LEVEL ?? (nodeEnv === 'test' ? 'silent' : DEFAULT_LOG_LEVEL),
  nodeEnv,
  port: Number.isNaN(parsedPort) ? DEFAULT_PORT : parsedPort,
} as const;

export default config;
