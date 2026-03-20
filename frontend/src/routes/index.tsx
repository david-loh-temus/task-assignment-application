import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { developersListQueryOptions } from '@features/developers/queries/developers-queries';
import { skillsListQueryOptions } from '@features/skills/queries/skills-queries';
import { TaskListPage } from '@features/tasks/pages/TaskListPage';
import { tasksListQueryOptions } from '@features/tasks/queries/tasks-queries';

const TasksRoute = () => {
  const { data: tasks } = useSuspenseQuery(tasksListQueryOptions());
  const { data: developers } = useSuspenseQuery(developersListQueryOptions());
  const { data: skills } = useSuspenseQuery(skillsListQueryOptions());

  return <TaskListPage developers={developers} skills={skills} tasks={tasks} />;
};

export const Route = createFileRoute('/')({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(tasksListQueryOptions()),
      context.queryClient.ensureQueryData(developersListQueryOptions()),
      context.queryClient.ensureQueryData(skillsListQueryOptions()),
    ]);
  },
  component: TasksRoute,
});
