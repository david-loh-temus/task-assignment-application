import { afterAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

const originalEnv = process.env;

describe('config', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    jest.doMock('dotenv', () => ({
      __esModule: true,
      default: {
        config: jest.fn(),
      },
    }));
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('reads database settings from environment variables', async () => {
    process.env.DATABASE_URL = 'postgres://postgres:postgres@localhost:5432/task_assignment';
    process.env.PORT = '4010';

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require('../config').default as typeof import('../config').default;

    expect(config.db.url).toBe(process.env.DATABASE_URL);
    expect(config.port).toBe(4010);
  });

  it('defaults the database url to an empty string when not configured', async () => {
    delete process.env.DATABASE_URL;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require('../config').default as typeof import('../config').default;

    expect(config.db.url).toBe('');
  });
});
