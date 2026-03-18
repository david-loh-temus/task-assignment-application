import type { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import type { ErrorResponse } from './http-errors';

export type SuccessResponse<T> = {
  data: T;
};

type ApiErrorPayload = ErrorResponse['error'];

/**
 * Sends a 200 OK response with the provided data.
 * @param res The Express response object.
 * @param data The data to include in the response.
 * @returns The Express response object.
 */
export function sendOk<T>(res: Response, data: T): Response<SuccessResponse<T>> {
  return res.status(StatusCodes.OK).json({ data });
}

/**
 * Sends a 201 Created response with the provided data.
 * @param res The Express response object.
 * @param data The data to include in the response.
 * @returns The Express response object.
 */
export function sendCreated<T>(res: Response, data: T): Response<SuccessResponse<T>> {
  return res.status(StatusCodes.CREATED).json({ data });
}

/**
 * Sends a 202 Accepted response with the provided data.
 * @param res The Express response object.
 * @param data The data to include in the response.
 * @returns The Express response object.
 */
export function sendAccepted<T>(res: Response, data: T): Response<SuccessResponse<T>> {
  return res.status(StatusCodes.ACCEPTED).json({ data });
}

/**
 * Sends an error response with the provided error payload.
 * @param res The Express response object.
 * @param error The error payload to include in the response.
 * @returns The Express response object.
 */
export function sendError(res: Response, error: ApiErrorPayload): Response<ErrorResponse> {
  return res.status(error.status).json({ error });
}
