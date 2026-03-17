import type { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import type { ErrorResponse } from './http-errors';

export type SuccessResponse<T> = {
  data: T;
};

type ApiErrorPayload = ErrorResponse['error'];

export function sendOk<T>(res: Response, data: T): Response<SuccessResponse<T>> {
  return res.status(StatusCodes.OK).json({ data });
}

export function sendCreated<T>(res: Response, data: T): Response<SuccessResponse<T>> {
  return res.status(StatusCodes.CREATED).json({ data });
}

export function sendAccepted<T>(res: Response, data: T): Response<SuccessResponse<T>> {
  return res.status(StatusCodes.ACCEPTED).json({ data });
}

export function sendNotFound(res: Response, error: ApiErrorPayload): Response<ErrorResponse> {
  return res.status(StatusCodes.NOT_FOUND).json({ error });
}

export function sendInternalServerError(res: Response, error: ApiErrorPayload): Response<ErrorResponse> {
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error });
}

export function sendError(res: Response, error: ApiErrorPayload): Response<ErrorResponse> {
  return res.status(error.status).json({ error });
}
