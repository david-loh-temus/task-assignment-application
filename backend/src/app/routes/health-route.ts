import type { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

const healthRoute: RequestHandler = (_req, res): void => {
  res.status(StatusCodes.OK).json({ status: 'ok' });
};

export default healthRoute;
