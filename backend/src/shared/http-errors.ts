import { StatusCodes } from 'http-status-codes';

export class HttpError extends Error {
  code: string;
  message: string;
  status: number;

  constructor(error: { code: string; message: string; status: number }) {
    super(error.message);
    this.name = 'HttpError';
    this.code = error.code;
    this.message = error.message;
    this.status = error.status;
  }
}

export type ErrorResponse = {
  error: {
    code: string;
    message: string;
    status: number;
  };
};

export const INTERNAL_SERVER_ERROR = {
  code: 'INTERNAL_SERVER_ERROR',
  message: 'An unexpected error occurred',
  status: StatusCodes.INTERNAL_SERVER_ERROR,
} as const;

export const BAD_REQUEST_ERROR = {
  code: 'BAD_REQUEST',
  message: 'The request is invalid',
  status: StatusCodes.BAD_REQUEST,
} as const;

export const NOT_FOUND_ERROR = {
  code: 'NOT_FOUND',
  message: 'Resource not found',
  status: StatusCodes.NOT_FOUND,
} as const;

export const CONFLICT_ERROR = {
  code: 'CONFLICT',
  message: 'Resource already exists',
  status: StatusCodes.CONFLICT,
} as const;

export const FORBIDDEN_ERROR = {
  code: 'FORBIDDEN',
  message: 'Forbidden',
  status: StatusCodes.FORBIDDEN,
} as const;

export const SERVICE_UNAVAILABLE_ERROR = {
  code: 'SERVICE_UNAVAILABLE',
  message: 'Service unavailable',
  status: StatusCodes.SERVICE_UNAVAILABLE,
} as const;

export const ROUTE_NOT_FOUND_ERROR = {
  code: 'ROUTE_NOT_FOUND',
  message: 'The requested route cannot be found',
  status: StatusCodes.NOT_FOUND,
} as const;

export function createHttpError(error: { code: string; message: string; status: number }): HttpError {
  return new HttpError(error);
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}
