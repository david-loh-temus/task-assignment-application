import type { ErrorRequestHandler } from 'express';

import logger from '../../lib/logger';
import { sendError, sendInternalServerError } from '../../shared/api-response';
import { INTERNAL_SERVER_ERROR, type HttpError } from '../../shared/http-errors';

const genericErrorHandler: ErrorRequestHandler = (err: HttpError, _req, res, _next): void => {
  const status = typeof err.status === 'number' ? err.status : INTERNAL_SERVER_ERROR.status;
  const code = typeof err.code === 'string' ? err.code : INTERNAL_SERVER_ERROR.code;
  const message =
    status >= INTERNAL_SERVER_ERROR.status
      ? INTERNAL_SERVER_ERROR.message
      : err.message || INTERNAL_SERVER_ERROR.message;

  logger.error(
    {
      code,
      err,
      status,
    },
    'Request failed',
  );

  const error = {
    code,
    message,
    status,
  };

  if (status === INTERNAL_SERVER_ERROR.status) {
    sendInternalServerError(res, error);
    return;
  }

  sendError(res, error);
};

export default genericErrorHandler;
