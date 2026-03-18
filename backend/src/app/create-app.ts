import cors from 'cors';
import type { Express } from 'express';
import express from 'express';
import helmet from 'helmet';

import developersRouter from '../modules/developers/developers.routes';

import genericErrorHandler from './middleware/generic-error-handler';
import notFoundErrorHandler from './middleware/not-found-error-handler';
import healthRoute from './routes/health-route';
import { getOpenApiSpec, swaggerUiServe, swaggerUiSetup } from './swagger';

export default function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(helmet());
  app.use(express.json());

  app.get('/health', healthRoute);

  app.use('/developers', developersRouter);
  app.get('/api-docs.json', (_req, res) => {
    res.json(getOpenApiSpec());
  });
  app.use('/api-docs', swaggerUiServe, swaggerUiSetup);

  app.use(notFoundErrorHandler);
  app.use(genericErrorHandler);

  return app;
}
