// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { taskCollectionFixture, taskFixture } from '@features/tasks/__fixtures__/task-fixtures';
import { getTaskById, getTasks } from '@features/tasks/api/tasks-api';
import { createQueryClient } from '@lib/query/query-client';
import {
  taskDetailQueryOptions,
  taskQueryKeys,
  tasksListQueryOptions,
  useTaskQuery,
  useTasksQuery,
} from '../tasks-queries';
import type { PropsWithChildren } from 'react';

vi.mock('@features/tasks/api/tasks-api', () => ({
  getTaskById: vi.fn(),
  getTasks: vi.fn(),
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

describe('tasks-queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds stable keys for task list and detail queries', () => {
    expect(taskQueryKeys.all).toEqual(['tasks']);
    expect(taskQueryKeys.list()).toEqual(['tasks', 'list']);
    expect(taskQueryKeys.detail(taskFixture.id)).toEqual(['tasks', 'detail', taskFixture.id]);
  });

  it('uses the task API in the list query options', async () => {
    vi.mocked(getTasks).mockResolvedValue(taskCollectionFixture);
    const { queryClient } = createWrapper();

    await expect(queryClient.fetchQuery(tasksListQueryOptions())).resolves.toEqual(taskCollectionFixture);
    expect(getTasks).toHaveBeenCalledTimes(1);
  });

  it('uses the task API in the detail query options', async () => {
    vi.mocked(getTaskById).mockResolvedValue(taskFixture);
    const { queryClient } = createWrapper();

    await expect(queryClient.fetchQuery(taskDetailQueryOptions(taskFixture.id))).resolves.toEqual(taskFixture);
    expect(getTaskById).toHaveBeenCalledWith(taskFixture.id);
  });

  it('reads the task list through React Query', async () => {
    vi.mocked(getTasks).mockResolvedValue(taskCollectionFixture);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useTasksQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(taskCollectionFixture);
    expect(getTasks).toHaveBeenCalledTimes(1);
  });

  it('does not run the detail query without an id', async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useTaskQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.fetchStatus).toBe('idle');
    });

    expect(result.current.data).toBeUndefined();
    expect(getTaskById).not.toHaveBeenCalled();
  });

  it('reads a task detail through React Query when an id is provided', async () => {
    vi.mocked(getTaskById).mockResolvedValue(taskFixture);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useTaskQuery(taskFixture.id), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(taskFixture);
    expect(getTaskById).toHaveBeenCalledWith(taskFixture.id);
  });
});
