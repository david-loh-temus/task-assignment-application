import { beforeEach, describe, expect, it, jest } from '@jest/globals';

type DatabaseModuleContext = {
  connectToDatabase: () => Promise<void>;
  db: unknown;
  disconnectFromDatabase: () => Promise<void>;
  mocks: {
    Kysely: jest.Mock;
    Pool: jest.Mock;
    PostgresDialect: jest.Mock;
    destroy: jest.Mock;
    error: jest.Mock;
    execute: jest.Mock;
    info: jest.Mock;
    sql: jest.Mock;
  };
};

async function loadDatabaseModule({
  destroyImplementation,
  executeImplementation,
  url = 'postgres://postgres:postgres@localhost:5432/task_assignment',
}: {
  destroyImplementation?: () => Promise<void>;
  executeImplementation?: () => Promise<void>;
  url?: string;
} = {}): Promise<DatabaseModuleContext> {
  jest.resetModules();

  const destroy = jest.fn(destroyImplementation ?? (async () => undefined));
  const execute = jest.fn(executeImplementation ?? (async () => undefined));
  const error = jest.fn();
  const info = jest.fn();
  const Pool = jest.fn();
  const PostgresDialect = jest.fn();
  const Kysely = jest.fn(() => ({ destroy }));
  const sql = jest.fn(() => ({ execute }));

  jest.doMock('pg', () => ({
    Pool,
  }));
  jest.doMock('kysely', () => ({
    Kysely,
    PostgresDialect,
    sql,
  }));
  jest.doMock('../../config/config', () => ({
    __esModule: true,
    default: {
      db: { url },
      logLevel: 'silent',
      nodeEnv: 'test',
      port: 4000,
    },
  }));
  jest.doMock('../../lib/logger', () => ({
    __esModule: true,
    default: {
      error,
      info,
    },
  }));

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const databaseModule = require('../database') as typeof import('../database');

  return {
    ...databaseModule,
    mocks: {
      destroy,
      error,
      execute,
      info,
      Kysely,
      Pool,
      PostgresDialect,
      sql,
    },
  };
}

describe('database', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds the database singleton with the configured connection string', async () => {
    const context = await loadDatabaseModule();

    expect(context.mocks.Pool).toHaveBeenCalledWith({
      connectionString: 'postgres://postgres:postgres@localhost:5432/task_assignment',
    });
    expect(context.mocks.PostgresDialect).toHaveBeenCalled();
    expect(context.mocks.Kysely).toHaveBeenCalled();
  });

  it('connects to the database with a lightweight probe query', async () => {
    const context = await loadDatabaseModule();

    await context.connectToDatabase();

    expect(context.mocks.sql).toHaveBeenCalled();
    expect(context.mocks.execute).toHaveBeenCalledWith(context.db);
    expect(context.mocks.info).toHaveBeenCalledWith('Database connection established');
  });

  it('fails fast when the database url is missing', async () => {
    const context = await loadDatabaseModule({
      url: '',
    });

    await expect(context.connectToDatabase()).rejects.toThrow('DATABASE_URL is not configured');
    expect(context.mocks.error).toHaveBeenCalledWith(
      expect.objectContaining({
        err: expect.any(Error),
      }),
      'Failed to connect to database',
    );
  });

  it('closes the database connection cleanly', async () => {
    const context = await loadDatabaseModule();

    await context.disconnectFromDatabase();

    expect(context.mocks.destroy).toHaveBeenCalledTimes(1);
    expect(context.mocks.info).toHaveBeenCalledWith('Database connection closed');
  });
});
