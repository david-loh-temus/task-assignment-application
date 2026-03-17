import cors from 'cors';
import express from 'express';
import type { Express } from 'express';
import helmet from 'helmet';

import genericErrorHandler from './middleware/generic-error-handler';
import notFoundErrorHandler from './middleware/not-found-error-handler';
import healthRoute from './routes/health-route';

export default function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(helmet());
  app.use(express.json());

  app.get('/health', healthRoute);

  app.use(notFoundErrorHandler);
  app.use(genericErrorHandler);

  return app;
}
