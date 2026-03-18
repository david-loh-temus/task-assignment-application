import type { ErrorRequestHandler, NextFunction, Request, Response } from 'express';

import logger from '../../lib/logger';
import { sendError } from '../../shared/api-response';
import { INTERNAL_SERVER_ERROR, isHttpError } from '../../shared/http-errors';

/**
 * A generic error handler middleware for Express applications.
 * @param err The error object that was thrown during request processing. This can be an instance of HttpError or any other error type.
 * @param _req The Express request object (not used in this handler).
 * @param res The Express response object, used to send the error response.
 * @param _next The next middleware function in the Express stack (not used in this handler).
 */
const genericErrorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const error = isHttpError(err)
    ? {
        code: err.code,
        message: err.message,
        status: err.status,
      }
    : INTERNAL_SERVER_ERROR;

  logger.error({ code: error.code, err, status: error.status }, 'Request failed');

  sendError(res, error);
};

export default genericErrorHandler;
