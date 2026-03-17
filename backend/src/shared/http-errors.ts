import { StatusCodes } from 'http-status-codes';

export type HttpError = Error & {
  code?: string;
  status?: number;
};

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

export const ROUTE_NOT_FOUND_ERROR = {
  code: 'ROUTE_NOT_FOUND',
  message: 'The requested route cannot be found',
  status: StatusCodes.NOT_FOUND,
} as const;
