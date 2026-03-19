import { AxiosError, HttpStatusCode } from 'axios';
import { describe, expect, it } from 'vitest';

import { createApiClient, normalizeApiError, unwrapApiResponse } from '../api-client';
import type { AxiosAdapter, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { ApiSuccessResponse } from '../api-client';

describe('unwrapApiResponse', () => {
  it('returns the data payload from the backend envelope', () => {
    const response: ApiSuccessResponse<{ id: string }> = {
      data: {
        id: 'task-1',
      },
    };

    expect(unwrapApiResponse(response)).toEqual({ id: 'task-1' });
  });
});

describe('normalizeApiError', () => {
  it('maps backend validation errors into a frontend-safe shape', () => {
    const axiosError = new AxiosError(
      'Request failed with status code 400',
      AxiosError.ERR_BAD_REQUEST,
      undefined,
      undefined,
      {
        config: {} as AxiosRequestConfig,
        data: {
          error: {
            code: 'BAD_REQUEST',
            details: {
              field: 'title',
            },
            message: 'Task title is required',
            status: HttpStatusCode.BadRequest,
          },
        },
        headers: {},
        status: HttpStatusCode.BadRequest,
        statusText: 'Bad Request',
      } as AxiosResponse,
    );

    expect(normalizeApiError(axiosError)).toEqual({
      code: 'BAD_REQUEST',
      details: {
        field: 'title',
      },
      message: 'Task title is required',
      status: HttpStatusCode.BadRequest,
      type: 'http',
    });
  });

  it('returns a network error when the request has no response', () => {
    const axiosError = new AxiosError('Network Error', AxiosError.ERR_NETWORK);

    expect(normalizeApiError(axiosError)).toEqual({
      code: undefined,
      details: undefined,
      message: 'Network Error',
      status: undefined,
      type: 'network',
    });
  });

  it('falls back to an unknown error shape for non-Axios errors', () => {
    expect(normalizeApiError(new Error('Unexpected failure'))).toEqual({
      code: undefined,
      details: undefined,
      message: 'Unexpected failure',
      status: undefined,
      type: 'unknown',
    });
  });

  it('falls back to the Axios message when the response body is not the standard error shape', () => {
    const axiosError = new AxiosError(
      'Request failed with status code 500',
      AxiosError.ERR_BAD_RESPONSE,
      undefined,
      undefined,
      {
        config: {} as AxiosRequestConfig,
        data: 'Internal Server Error',
        headers: {},
        status: HttpStatusCode.InternalServerError,
        statusText: 'Internal Server Error',
      } as AxiosResponse,
    );

    expect(normalizeApiError(axiosError)).toEqual({
      code: undefined,
      details: undefined,
      message: 'Request failed with status code 500',
      status: HttpStatusCode.InternalServerError,
      type: 'http',
    });
  });
});

describe('createApiClient', () => {
  it('creates an axios instance with the configured base URL', async () => {
    let capturedConfig: AxiosRequestConfig | undefined;

    const adapter: AxiosAdapter = async (requestConfig) => {
      capturedConfig = requestConfig;

      return {
        config: requestConfig,
        data: {
          data: [],
        },
        headers: {},
        status: HttpStatusCode.Ok,
        statusText: 'OK',
      };
    };

    const client = createApiClient({
      adapter,
      baseURL: 'http://127.0.0.1:4000',
    });

    await client.get('/skills');

    expect(capturedConfig?.baseURL).toBe('http://127.0.0.1:4000');
  });

  it('normalizes Axios failures through the response interceptor', async () => {
    const adapter: AxiosAdapter = async (requestConfig) => {
      throw new AxiosError(
        'Request failed with status code 500',
        AxiosError.ERR_BAD_RESPONSE,
        requestConfig,
        undefined,
        {
          config: requestConfig,
          data: {
            error: {
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Server exploded',
              status: HttpStatusCode.InternalServerError,
            },
          },
          headers: {},
          status: HttpStatusCode.InternalServerError,
          statusText: 'Internal Server Error',
        } as AxiosResponse,
      );
    };

    const client = createApiClient({
      adapter,
      baseURL: 'http://127.0.0.1:4000',
    });

    await expect(client.get('/tasks')).rejects.toEqual({
      code: 'INTERNAL_SERVER_ERROR',
      details: undefined,
      message: 'Server exploded',
      status: HttpStatusCode.InternalServerError,
      type: 'http',
    });
  });
});
