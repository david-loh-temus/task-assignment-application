import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

import { updateTaskById } from '@features/tasks/api/tasks-api';
import { taskQueryKeys } from '@features/tasks/queries/tasks-queries';
import type { UpdateTaskInput } from '@features/tasks/types/task';

type UpdateTaskMutationVariables = {
  id: string;
  input: UpdateTaskInput;
};

/**
 * Mutation hook for updating tasks (status, assignee).
 * Refetches task data after mutation completes to sync with server state.
 */
export const useUpdateTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: UpdateTaskMutationVariables) => updateTaskById(id, input),
    onError: () => {
      message.error('Unable to update the task. Please try again.');
    },
    onSettled: async () => {
      // Refetch to ensure cache stays in sync with server state
      await queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
    },
  });
};
