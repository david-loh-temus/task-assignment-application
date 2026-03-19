import type { TaskStatus } from '@features/tasks/types/task';

export type DeveloperSkill = {
  id: string;
  name: string;
};

export type DeveloperTask = {
  id: string;
  displayId: number;
  title: string;
  status: TaskStatus;
};

export type Developer = {
  id: string;
  name: string;
  skills: DeveloperSkill[];
  tasks: DeveloperTask[];
  createdAt: string;
  updatedAt: string;
};
