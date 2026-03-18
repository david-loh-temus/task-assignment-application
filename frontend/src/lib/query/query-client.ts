import { QueryClient } from '@tanstack/react-query';

import { isClientError } from '@lib/api/api-client';
import type { ApiError } from '@lib/api/api-client';

export const QUERY_STALE_TIME_MS = 30_000;
export const QUERY_GC_TIME_MS = 300_000;
const MAX_QUERY_RETRIES = 1;

export const shouldRetryQuery = (failureCount: number, error: unknown): boolean => {
  const apiError = error as ApiError | undefined;

  if (apiError?.type === 'http' && isClientError(apiError.status)) {
    return false;
  }

  return failureCount < MAX_QUERY_RETRIES;
};

/**
 * Creates the shared TanStack Query client with app-wide defaults.
 */
export const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      mutations: {
        retry: false,
      },
      queries: {
        gcTime: QUERY_GC_TIME_MS,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        retry: shouldRetryQuery,
        staleTime: QUERY_STALE_TIME_MS,
      },
    },
  });
