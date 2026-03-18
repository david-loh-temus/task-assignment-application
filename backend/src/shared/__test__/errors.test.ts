import { describe, expect, it } from '@jest/globals';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { badRequest, fromZodError, notFound } from '../errors';

describe('errors', () => {
  it('creates a reusable not found error', () => {
    const error = notFound('Developer not found');

    expect(error).toMatchObject({
      code: 'NOT_FOUND',
      message: 'Developer not found',
      status: StatusCodes.NOT_FOUND,
    });
  });

  it('creates a reusable bad request error', () => {
    const error = badRequest('Invalid request');

    expect(error).toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Invalid request',
      status: StatusCodes.BAD_REQUEST,
    });
  });

  it('converts a zod error into a bad request error', () => {
    const schema = z.object({
      id: z.string().uuid('Developer id must be a valid UUID'),
    });

    const result = schema.safeParse({
      id: 'not-a-uuid',
    });

    if (result.success) {
      throw new Error('Expected schema parsing to fail');
    }

    const error = fromZodError(result.error, 'Fallback message');

    expect(error).toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Developer id must be a valid UUID',
      status: StatusCodes.BAD_REQUEST,
    });
  });
});
