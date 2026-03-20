import type { TaskStatus } from '@features/tasks/types/task';

export type TaskFormValues = {
  title: string;
  description?: string;
  skillIds?: string[];
  assignedDeveloperId?: string | null;
  status?: TaskStatus;
};

export type TaskFormOutput = {
  title: string;
  description: string | null;
  assignedDeveloperId?: string | null;
  skillIds?: string[];
  status?: TaskStatus;
};

export const normalizeTaskFormValues = (values: TaskFormValues): TaskFormOutput => {
  const description = values.description?.trim();

  return {
    title: values.title.trim(),
    description: description && description.length > 0 ? description : null,
    skillIds: values.skillIds && values.skillIds.length > 0 ? values.skillIds : undefined,
    assignedDeveloperId: values.assignedDeveloperId ?? null,
    status: values.status,
  };
};
