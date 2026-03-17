import { beforeEach, describe, expect, it, jest } from '@jest/globals';

type DatabaseModuleContext = {
  connectToDatabase: () => Promise<void>;
  db: {
    $connect: jest.Mock;
    $disconnect: jest.Mock;
    $queryRaw: jest.Mock;
  };
  disconnectFromDatabase: () => Promise<void>;
  mocks: {
    PrismaClient: jest.Mock;
    connect: jest.Mock;
    disconnect: jest.Mock;
    error: jest.Mock;
    info: jest.Mock;
    queryRaw: jest.Mock;
  };
};

async function loadDatabaseModule({
  connectImplementation,
  disconnectImplementation,
  queryRawImplementation,
  url = 'postgres://postgres:postgres@localhost:5432/task_assignment',
}: {
  connectImplementation?: () => Promise<void>;
  disconnectImplementation?: () => Promise<void>;
  queryRawImplementation?: () => Promise<void>;
  url?: string;
} = {}): Promise<DatabaseModuleContext> {
  jest.resetModules();

  const connect = jest.fn(connectImplementation ?? (async () => undefined));
  const disconnect = jest.fn(disconnectImplementation ?? (async () => undefined));
  const queryRaw = jest.fn(queryRawImplementation ?? (async () => undefined));
  const error = jest.fn();
  const info = jest.fn();
  const PrismaClient = jest.fn(() => ({
    $connect: connect,
    $disconnect: disconnect,
    $queryRaw: queryRaw,
  }));

  jest.doMock('@prisma/client', () => ({
    PrismaClient,
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
      PrismaClient,
      connect,
      disconnect,
      error,
      info,
      queryRaw,
    },
  };
}

describe('database', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds the database singleton with PrismaClient', async () => {
    const context = await loadDatabaseModule();

    expect(context.mocks.PrismaClient).toHaveBeenCalledWith({
      log: ['error'],
    });
  });

  it('connects to the database with a lightweight probe query', async () => {
    const context = await loadDatabaseModule();

    await context.connectToDatabase();

    expect(context.mocks.connect).toHaveBeenCalledTimes(1);
    expect(context.mocks.queryRaw).toHaveBeenCalledTimes(1);
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

    expect(context.mocks.disconnect).toHaveBeenCalledTimes(1);
    expect(context.mocks.info).toHaveBeenCalledWith('Database connection closed');
  });
});
