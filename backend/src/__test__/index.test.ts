import { EventEmitter } from 'node:events';
import type { Express } from 'express';
import type { Server } from 'node:http';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

class FakeServer extends EventEmitter {
  public readonly close = jest.fn((callback: (error?: Error) => void): void => {
    callback();
  });
}

async function loadIndexModule({
  createAppImplementation,
}: {
  createAppImplementation?: () => Express;
} = {}) {
  jest.resetModules();

  const info = jest.fn();
  const error = jest.fn();
  const fatal = jest.fn();

  jest.doMock('../config/config', () => ({
    __esModule: true,
    default: {
      db: {
        url: 'postgres://postgres:postgres@localhost:5432/task_assignment',
      },
      logLevel: 'silent',
      nodeEnv: 'test',
      port: 4000,
    },
  }));
  jest.doMock('../lib/logger', () => ({
    __esModule: true,
    default: {
      error,
      fatal,
      info,
    },
  }));
  jest.doMock('../app/create-app', () => ({
    __esModule: true,
    default:
      createAppImplementation ??
      (() =>
        ({
          listen: jest.fn(() => new FakeServer() as unknown as Server),
        }) as unknown as Express),
  }));

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const indexModule = require('../index') as typeof import('../index');

  return {
    ...indexModule,
    mocks: {
      error,
      fatal,
      info,
    },
  };
}

describe('startApplication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('connects before starting the server', async () => {
    const server = new FakeServer();
    const listen = jest.fn((_: number, callback: () => void) => {
      callback();
      return server as unknown as Server;
    });
    const connect = jest.fn(async () => undefined);
    const disconnect = jest.fn(async () => undefined);
    const registerSignalHandler = jest.fn(() => process);
    const { mocks, startApplication } = await loadIndexModule({
      createAppImplementation: () =>
        ({
          listen,
        }) as unknown as Express,
    });

    await startApplication({
      connect,
      disconnect,
      registerSignalHandler,
    });

    expect(connect).toHaveBeenCalledTimes(1);
    expect(listen).toHaveBeenCalledWith(4000, expect.any(Function));
    expect(registerSignalHandler).toHaveBeenCalledTimes(2);
    expect(mocks.info).toHaveBeenCalledWith(
      {
        nodeEnv: 'test',
        port: 4000,
      },
      'Task Assignment backend listening',
    );
  });

  it('exits when the database connection fails', async () => {
    const connectError = new Error('connection failed');
    const exit = jest.fn((_: number) => {
      throw new Error('process exited');
    }) as unknown as (code: number) => never;
    const { mocks, startApplication } = await loadIndexModule();

    await expect(
      startApplication({
        connect: jest.fn(async () => {
          throw connectError;
        }),
        exit,
      }),
    ).rejects.toThrow('process exited');

    expect(mocks.fatal).toHaveBeenCalledWith(
      {
        err: connectError,
      },
      'Application startup failed',
    );
  });

  it('disconnects and exits when the server emits a startup error', async () => {
    const server = new FakeServer();
    const disconnect = jest.fn(async () => undefined);
    const exit = jest.fn() as unknown as (code: number) => never;
    const { mocks, startApplication } = await loadIndexModule({
      createAppImplementation: () =>
        ({
          listen: jest.fn((_: number, callback: () => void) => {
            callback();
            setImmediate(() => {
              server.emit(
                'error',
                Object.assign(new Error('port in use'), {
                  code: 'EADDRINUSE',
                }),
              );
            });
            return server as unknown as Server;
          }),
        }) as unknown as Express,
    });

    await startApplication({
      connect: jest.fn(async () => undefined),
      disconnect,
      exit,
    });
    await new Promise((resolve) => {
      setImmediate(resolve);
    });

    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledWith(1);
    expect(mocks.fatal).toHaveBeenCalledWith(
      {
        err: expect.objectContaining({
          code: 'EADDRINUSE',
        }),
        port: 4000,
      },
      'Unable to start server',
    );
  });

  it('closes the server and database on shutdown signals', async () => {
    const server = new FakeServer();
    const disconnect = jest.fn(async () => undefined);
    const signalHandlers = new Map<NodeJS.Signals, () => void>();
    const { mocks, startApplication } = await loadIndexModule({
      createAppImplementation: () =>
        ({
          listen: jest.fn((_: number, callback: () => void) => {
            callback();
            return server as unknown as Server;
          }),
        }) as unknown as Express,
    });

    await startApplication({
      connect: jest.fn(async () => undefined),
      disconnect,
      registerSignalHandler: jest.fn((signal, handler) => {
        signalHandlers.set(signal, handler);
        return process;
      }),
    });

    signalHandlers.get('SIGTERM')?.();
    await new Promise((resolve) => {
      setImmediate(resolve);
    });

    expect(server.close).toHaveBeenCalledTimes(1);
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(mocks.info).toHaveBeenCalledWith(
      {
        signal: 'SIGTERM',
      },
      'Shutdown signal received',
    );
    expect(mocks.info).toHaveBeenCalledWith('Server shutdown completed');
  });
});
