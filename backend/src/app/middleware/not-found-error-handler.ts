import type { RequestHandler } from 'express';

import { sendError } from '../../shared/api-response';
import { ROUTE_NOT_FOUND_ERROR } from '../../shared/http-errors';

const notFoundErrorHandler: RequestHandler = (_req, res): void => {
  sendError(res, ROUTE_NOT_FOUND_ERROR);
};

export default notFoundErrorHandler;
