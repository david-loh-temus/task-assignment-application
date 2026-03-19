import { queryOptions, skipToken, useQuery } from '@tanstack/react-query';

import { getTaskById, getTasks } from '@features/tasks/api/tasks-api';

export const taskQueryKeys = {
  all: ['tasks'] as const,
  detail: (id: string) => [...taskQueryKeys.all, 'detail', id] as const,
  list: () => [...taskQueryKeys.all, 'list'] as const,
};

/**
 * Builds query options for the tasks collection.
 * @returns Query options for the task list cache entry.
 */
export const tasksListQueryOptions = () =>
  queryOptions({
    queryKey: taskQueryKeys.list(),
    queryFn: () => getTasks(),
  });

/**
 * Builds query options for a single task.
 * @param id Task identifier.
 * @returns Query options for the task detail cache entry.
 */
export const taskDetailQueryOptions = (id?: string) =>
  queryOptions({
    queryKey: taskQueryKeys.detail(id ?? ''),
    queryFn: id ? () => getTaskById(id) : skipToken,
  });

/**
 * Reads the tasks collection from the shared query cache.
 * @returns The task list query result.
 */
export const useTasksQuery = () => useQuery(tasksListQueryOptions());

/**
 * Reads a single task from the shared query cache.
 * @param id Task identifier.
 * @returns The task detail query result.
 */
export const useTaskQuery = (id?: string) => useQuery(taskDetailQueryOptions(id));
