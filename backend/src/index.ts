import createApp from './app/create-app';
import config from './config/config';
import logger from './lib/logger';

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

server.on('error', (error: NodeJS.ErrnoException) => {
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
      process.exit(1);
    default:
      throw error;
  }
});
