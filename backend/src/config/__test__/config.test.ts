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
    process.env.GEMINI_API_KEY = 'gemini-key';
    process.env.GEMINI_MODEL = 'gemini-custom-model';
    process.env.PORT = '4010';

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require('../config').default as typeof import('../config').default;

    expect(config.db.url).toBe(process.env.DATABASE_URL);
    expect(config.gemini.apiKey).toBe('gemini-key');
    expect(config.gemini.model).toBe('gemini-custom-model');
    expect(config.port).toBe(4010);
  });

  it('defaults the database url to an empty string when not configured', async () => {
    delete process.env.DATABASE_URL;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_MODEL;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require('../config').default as typeof import('../config').default;

    expect(config.db.url).toBe('');
    expect(config.gemini.apiKey).toBe('');
    expect(config.gemini.model).toBe('gemini-3-pro-preview');
  });
});
