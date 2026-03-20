import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { developersListQueryOptions } from '@features/developers/queries/developers-queries';
import { skillsListQueryOptions } from '@features/skills/queries/skills-queries';
import { CreateTaskPage } from '@features/tasks/pages/CreateTaskPage';

const CreateTaskRoute = () => {
  const { data: developers } = useSuspenseQuery(developersListQueryOptions());
  const { data: skills } = useSuspenseQuery(skillsListQueryOptions());

  return <CreateTaskPage developers={developers} skills={skills} />;
};

export const Route = createFileRoute('/create-task')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(developersListQueryOptions());
    await context.queryClient.ensureQueryData(skillsListQueryOptions());
  },
  component: CreateTaskRoute,
});
