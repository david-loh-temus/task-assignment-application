import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { StatusCodes } from 'http-status-codes';

import logger from '../../../lib/logger';
import genericErrorHandler from '../generic-error-handler';

describe('genericErrorHandler', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns a standardized 500 payload for unexpected errors', () => {
    const response = {
      json: jest.fn(),
      status: jest.fn(),
    };

    response.status.mockReturnValue(response);
    jest.spyOn(logger, 'error').mockImplementation(() => logger);

    genericErrorHandler(new Error('boom'), {} as never, response as never, jest.fn());

    expect(response.status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(response.json).toHaveBeenCalledWith({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      },
    });
  });

  it('preserves client error status and code', () => {
    const response = {
      json: jest.fn(),
      status: jest.fn(),
    };
    const error = Object.assign(new Error('Bad request'), {
      code: 'BAD_REQUEST',
      status: StatusCodes.BAD_REQUEST,
    });

    response.status.mockReturnValue(response);
    jest.spyOn(logger, 'error').mockImplementation(() => logger);

    genericErrorHandler(error, {} as never, response as never, jest.fn());

    expect(response.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith({
      error: {
        code: 'BAD_REQUEST',
        message: 'Bad request',
        status: StatusCodes.BAD_REQUEST,
      },
    });
  });
});
