import { jest } from '@jest/globals';
import type { NextFunction, Response } from 'express';

/**
 * Test double (mock) for Express Response object.
 * Records method calls for assertion without making real HTTP requests.
 */
export type ResponseMock = Response & {
  json: jest.Mock;
  status: jest.Mock;
};

/**
 * Create a mock Response object for testing route handlers.
 * Automatically chains status().json() calls.
 */
export function createResponseMock(): ResponseMock {
  const response = {
    json: jest.fn(),
    status: jest.fn(),
  };
  response.status.mockReturnValue(response);
  return response as unknown as ResponseMock;
}

/**
 * Create a mock NextFunction for testing middleware error handling.
 */
export function createNextMock(): jest.Mock<NextFunction> {
  return jest.fn();
}
