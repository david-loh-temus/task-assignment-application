import type { RequestHandler } from 'express';

import { sendNotFound } from '../../shared/api-response';
import { ROUTE_NOT_FOUND_ERROR } from '../../shared/http-errors';

const notFoundErrorHandler: RequestHandler = (_req, res): void => {
  sendNotFound(res, ROUTE_NOT_FOUND_ERROR);
};

export default notFoundErrorHandler;
