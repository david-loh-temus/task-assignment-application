import { describe, expect, it, jest } from '@jest/globals';
import { StatusCodes } from 'http-status-codes';

import healthRoute from '../health-route';

describe('healthRoute', () => {
  it('returns a simple ok payload', () => {
    const response = {
      json: jest.fn(),
      status: jest.fn(),
    };

    response.status.mockReturnValue(response);

    healthRoute({} as never, response as never, jest.fn());

    expect(response.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(response.json).toHaveBeenCalledWith({ status: 'ok' });
  });
});
