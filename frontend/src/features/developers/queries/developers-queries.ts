import { queryOptions, skipToken, useQuery } from '@tanstack/react-query';

import { getDeveloperById, getDevelopers } from '@features/developers/api/developers-api';

export const developerQueryKeys = {
  all: ['developers'] as const,
  detail: (id: string) => [...developerQueryKeys.all, 'detail', id] as const,
  list: () => [...developerQueryKeys.all, 'list'] as const,
};

/**
 * Builds query options for the developers collection.
 * @returns Query options for the developer list cache entry.
 */
export const developersListQueryOptions = () =>
  queryOptions({
    queryKey: developerQueryKeys.list(),
    queryFn: () => getDevelopers(),
  });

/**
 * Builds query options for a single developer.
 * @param id Developer identifier.
 * @returns Query options for the developer detail cache entry.
 */
export const developerDetailQueryOptions = (id?: string) =>
  queryOptions({
    queryKey: developerQueryKeys.detail(id ?? ''),
    queryFn: id ? () => getDeveloperById(id) : skipToken,
  });

/**
 * Reads the developer collection from the shared query cache.
 * @returns The developer list query result.
 */
export const useDevelopersQuery = () => useQuery(developersListQueryOptions());

/**
 * Reads a single developer from the shared query cache.
 * @param id Developer identifier.
 * @returns The developer detail query result.
 */
export const useDeveloperQuery = (id?: string) => useQuery(developerDetailQueryOptions(id));
