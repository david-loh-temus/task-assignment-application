import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';

import {
  BAD_REQUEST_ERROR,
  CONFLICT_ERROR,
  FORBIDDEN_ERROR,
  NOT_FOUND_ERROR,
  SERVICE_UNAVAILABLE_ERROR,
  createHttpError,
  type HttpError,
} from './http-errors';

export function badRequest(
  message: string = BAD_REQUEST_ERROR.message,
  code: string = BAD_REQUEST_ERROR.code,
): HttpError {
  return createHttpError({
    code,
    message,
    status: StatusCodes.BAD_REQUEST,
  });
}

export function notFound(message: string = NOT_FOUND_ERROR.message, code: string = NOT_FOUND_ERROR.code): HttpError {
  return createHttpError({
    code,
    message,
    status: StatusCodes.NOT_FOUND,
  });
}

export function conflict(message: string = CONFLICT_ERROR.message, code: string = CONFLICT_ERROR.code): HttpError {
  return createHttpError({
    code,
    message,
    status: StatusCodes.CONFLICT,
  });
}

export function forbidden(message: string = FORBIDDEN_ERROR.message, code: string = FORBIDDEN_ERROR.code): HttpError {
  return createHttpError({
    code,
    message,
    status: StatusCodes.FORBIDDEN,
  });
}

export function serviceUnavailable(
  message: string = SERVICE_UNAVAILABLE_ERROR.message,
  code: string = SERVICE_UNAVAILABLE_ERROR.code,
): HttpError {
  return createHttpError({
    code,
    message,
    status: StatusCodes.SERVICE_UNAVAILABLE,
  });
}

export function fromZodError(error: ZodError, fallbackMessage: string = 'Validation failed'): HttpError {
  const message = error.issues.map((issue) => issue.message).join('; ') || fallbackMessage;

  return badRequest(message);
}
