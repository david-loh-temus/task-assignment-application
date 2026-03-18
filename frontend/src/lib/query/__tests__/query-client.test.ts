import { HttpStatusCode } from 'axios';
import { describe, expect, it } from 'vitest';

import { QUERY_GC_TIME_MS, QUERY_STALE_TIME_MS, createQueryClient, shouldRetryQuery } from '../query-client';

describe('shouldRetryQuery', () => {
  it('does not retry client errors', () => {
    expect(
      shouldRetryQuery(0, {
        code: 'BAD_REQUEST',
        details: undefined,
        message: 'Bad request',
        status: HttpStatusCode.BadRequest,
        type: 'http',
      }),
    ).toBe(false);
  });

  it('retries transient failures once', () => {
    expect(
      shouldRetryQuery(0, {
        code: 'INTERNAL_SERVER_ERROR',
        details: undefined,
        message: 'Server error',
        status: HttpStatusCode.InternalServerError,
        type: 'http',
      }),
    ).toBe(true);
    expect(
      shouldRetryQuery(1, {
        code: 'INTERNAL_SERVER_ERROR',
        details: undefined,
        message: 'Server error',
        status: HttpStatusCode.InternalServerError,
        type: 'http',
      }),
    ).toBe(false);
  });
});

describe('createQueryClient', () => {
  it('creates a query client with the shared default options', () => {
    const queryClient = createQueryClient();
    const queryDefaults = queryClient.getDefaultOptions().queries;
    const mutationDefaults = queryClient.getDefaultOptions().mutations;

    expect(queryDefaults?.retry).toBe(shouldRetryQuery);
    expect(queryDefaults?.refetchOnWindowFocus).toBe(false);
    expect(queryDefaults?.staleTime).toBe(QUERY_STALE_TIME_MS);
    expect(queryDefaults?.gcTime).toBe(QUERY_GC_TIME_MS);
    expect(mutationDefaults?.retry).toBe(false);
  });
});
