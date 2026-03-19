import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { developersListQueryOptions } from '@features/developers/queries/developers-queries';
import { TaskListPage } from '@features/tasks/pages/TaskListPage';
import { tasksListQueryOptions } from '@features/tasks/queries/tasks-queries';

const TasksRoute = () => {
  const { data: tasks } = useSuspenseQuery(tasksListQueryOptions());
  const { data: developers } = useSuspenseQuery(developersListQueryOptions());

  return <TaskListPage developers={developers} tasks={tasks} />;
};

export const Route = createFileRoute('/')({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(tasksListQueryOptions()),
      context.queryClient.ensureQueryData(developersListQueryOptions()),
    ]);
  },
  component: TasksRoute,
});
