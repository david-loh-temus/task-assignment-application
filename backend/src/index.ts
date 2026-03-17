import createApp from './app/create-app';
import config from './config/config';
import { connectToDatabase, disconnectFromDatabase } from './db/database';
import logger from './lib/logger';

type SignalHandler = (signal: NodeJS.Signals, listener: () => void) => NodeJS.Process;

type StartApplicationDependencies = {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  exit: (code: number) => never;
  registerSignalHandler: SignalHandler;
};

async function closeServer(
  server: ReturnType<typeof createApp>['listen'] extends (...args: never[]) => infer T ? T : never,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error?: Error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function registerShutdownHandlers(
  server: ReturnType<typeof createApp>['listen'] extends (...args: never[]) => infer T ? T : never,
  disconnect: () => Promise<void>,
  registerSignalHandler: SignalHandler,
): void {
  let isShuttingDown = false;

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;

    logger.info({ signal }, 'Shutdown signal received');

    try {
      await closeServer(server);
      await disconnect();
      logger.info('Server shutdown completed');
    } catch (error) {
      logger.error({ err: error }, 'Server shutdown failed');
    }
  };

  registerSignalHandler('SIGINT', () => {
    void shutdown('SIGINT');
  });
  registerSignalHandler('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}

export async function startApplication(dependencies: Partial<StartApplicationDependencies> = {}): Promise<void> {
  const {
    connect = connectToDatabase,
    disconnect = disconnectFromDatabase,
    exit = process.exit,
    registerSignalHandler = process.once.bind(process),
  } = dependencies;

  try {
    await connect();

    const app = createApp();
    const server = app.listen(config.port, () => {
      logger.info(
        {
          nodeEnv: config.nodeEnv,
          port: config.port,
        },
        'Task Assignment backend listening',
      );
    });

    registerShutdownHandlers(server, disconnect, registerSignalHandler);

    server.on('error', async (error: NodeJS.ErrnoException) => {
      await disconnect().catch((disconnectError: unknown) => {
        logger.error({ err: disconnectError }, 'Failed to close database connection after startup error');
      });

      switch (error.code) {
        case 'EACCES':
        case 'EADDRINUSE':
          logger.fatal(
            {
              err: error,
              port: config.port,
            },
            'Unable to start server',
          );
          break;
        default:
          logger.fatal(
            {
              err: error,
            },
            'Application startup failed',
          );
          break;
      }

      exit(1);
    });
  } catch (error) {
    logger.fatal(
      {
        err: error,
      },
      'Application startup failed',
    );

    exit(1);
  }
}

if (config.nodeEnv !== 'test') {
  void startApplication();
}
