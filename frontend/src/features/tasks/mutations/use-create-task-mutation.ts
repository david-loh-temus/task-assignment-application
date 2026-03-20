import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

import { createTask } from '@features/tasks/api/tasks-api';
import { taskQueryKeys } from '@features/tasks/queries/tasks-queries';
import type { CreateTaskInput } from '@features/tasks/types/task';

/**
 * Mutation hook for creating tasks.
 * Refetches the task collection after save so the list reflects the new task.
 */
export const useCreateTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input),
    onError: () => {
      message.error('Unable to create the task. Please try again.');
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
    },
  });
};
