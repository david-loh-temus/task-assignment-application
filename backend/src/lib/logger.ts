import pino from 'pino';

import config from '../config/config';

const logger = pino({
  enabled: config.nodeEnv !== 'test',
  level: config.logLevel,
});

export default logger;
