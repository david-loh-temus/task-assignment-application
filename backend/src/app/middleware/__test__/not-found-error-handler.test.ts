import { describe, expect, it, jest } from '@jest/globals';
import { StatusCodes } from 'http-status-codes';

import notFoundErrorHandler from '../not-found-error-handler';

describe('notFoundErrorHandler', () => {
  it('returns a standardized 404 payload', () => {
    const response = {
      json: jest.fn(),
      status: jest.fn(),
    };

    response.status.mockReturnValue(response);

    notFoundErrorHandler({} as never, response as never, jest.fn());

    expect(response.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
    expect(response.json).toHaveBeenCalledWith({
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: 'The requested route cannot be found',
        status: StatusCodes.NOT_FOUND,
      },
    });
  });
});
