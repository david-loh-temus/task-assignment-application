import { describe, expect, it, jest } from '@jest/globals';
import { StatusCodes } from 'http-status-codes';

import { sendAccepted, sendCreated, sendError, sendInternalServerError, sendNotFound, sendOk } from '../api-response';

function createResponseDouble(): {
  json: ReturnType<typeof jest.fn>;
  status: ReturnType<typeof jest.fn>;
} {
  const response = {
    json: jest.fn(),
    status: jest.fn(),
  };

  response.status.mockReturnValue(response);

  return response;
}

describe('api-response', () => {
  it('sends a 200 data response', () => {
    const response = createResponseDouble();

    sendOk(response as never, { status: 'ok' });

    expect(response.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(response.json).toHaveBeenCalledWith({ data: { status: 'ok' } });
  });

  it('sends a 201 data response', () => {
    const response = createResponseDouble();

    sendCreated(response as never, { id: 'task-1' });

    expect(response.status).toHaveBeenCalledWith(StatusCodes.CREATED);
    expect(response.json).toHaveBeenCalledWith({ data: { id: 'task-1' } });
  });

  it('sends a 202 data response', () => {
    const response = createResponseDouble();

    sendAccepted(response as never, { queued: true });

    expect(response.status).toHaveBeenCalledWith(StatusCodes.ACCEPTED);
    expect(response.json).toHaveBeenCalledWith({ data: { queued: true } });
  });

  it('sends a 404 error response', () => {
    const response = createResponseDouble();
    const error = {
      code: 'ROUTE_NOT_FOUND',
      message: 'The requested route cannot be found',
      status: StatusCodes.NOT_FOUND,
    };

    sendNotFound(response as never, error);

    expect(response.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
    expect(response.json).toHaveBeenCalledWith({ error });
  });

  it('sends a 500 error response', () => {
    const response = createResponseDouble();
    const error = {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    };

    sendInternalServerError(response as never, error);

    expect(response.status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(response.json).toHaveBeenCalledWith({ error });
  });

  it('sends an error response for the provided status', () => {
    const response = createResponseDouble();
    const error = {
      code: 'BAD_REQUEST',
      message: 'Bad request',
      status: StatusCodes.BAD_REQUEST,
    };

    sendError(response as never, error);

    expect(response.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith({ error });
  });
});
