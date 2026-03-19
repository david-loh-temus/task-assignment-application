// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { developerCollectionFixture, developerFixture } from '@features/developers/__fixtures__/developer-fixtures';
import { getDeveloperById, getDevelopers } from '@features/developers/api/developers-api';
import { createQueryClient } from '@lib/query/query-client';
import {
  developerDetailQueryOptions,
  developerQueryKeys,
  developersListQueryOptions,
  useDeveloperQuery,
  useDevelopersQuery,
} from '../developers-queries';
import type { PropsWithChildren } from 'react';

vi.mock('@features/developers/api/developers-api', () => ({
  getDeveloperById: vi.fn(),
  getDevelopers: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = createQueryClient();

  return {
    queryClient,
    wrapper: ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
};

describe('developers-queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds stable keys for developer list and detail queries', () => {
    expect(developerQueryKeys.all).toEqual(['developers']);
    expect(developerQueryKeys.list()).toEqual(['developers', 'list']);
    expect(developerQueryKeys.detail(developerFixture.id)).toEqual(['developers', 'detail', developerFixture.id]);
  });

  it('uses the developer API in the list query options', async () => {
    vi.mocked(getDevelopers).mockResolvedValue(developerCollectionFixture);
    const { queryClient } = createWrapper();

    await expect(queryClient.fetchQuery(developersListQueryOptions())).resolves.toEqual(developerCollectionFixture);
    expect(getDevelopers).toHaveBeenCalledTimes(1);
  });

  it('uses the developer API in the detail query options', async () => {
    vi.mocked(getDeveloperById).mockResolvedValue(developerFixture);
    const { queryClient } = createWrapper();

    await expect(queryClient.fetchQuery(developerDetailQueryOptions(developerFixture.id))).resolves.toEqual(
      developerFixture,
    );
    expect(getDeveloperById).toHaveBeenCalledWith(developerFixture.id);
  });

  it('reads the developer list through React Query', async () => {
    vi.mocked(getDevelopers).mockResolvedValue(developerCollectionFixture);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDevelopersQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(developerCollectionFixture);
    expect(getDevelopers).toHaveBeenCalledTimes(1);
  });

  it('does not run the detail query without an id', async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDeveloperQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.fetchStatus).toBe('idle');
    });

    expect(result.current.data).toBeUndefined();
    expect(getDeveloperById).not.toHaveBeenCalled();
  });

  it('reads a developer detail through React Query when an id is provided', async () => {
    vi.mocked(getDeveloperById).mockResolvedValue(developerFixture);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDeveloperQuery(developerFixture.id), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(developerFixture);
    expect(getDeveloperById).toHaveBeenCalledWith(developerFixture.id);
  });
});
