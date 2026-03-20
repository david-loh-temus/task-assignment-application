export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export type TaskAssignedDeveloper = {
  id: string;
  name: string;
};

export type TaskSkill = {
  id: string;
  name: string;
};

export type Task = {
  id: string;
  displayId: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  assignedDeveloper: TaskAssignedDeveloper | null;
  skills: TaskSkill[];
  createdAt: string;
  updatedAt: string;
};

export type CreateTaskInput = {
  title: string;
  description?: string | null;
  assignedDeveloperId?: string | null;
  skillIds?: string[];
  status?: TaskStatus;
};

export type UpdateTaskInput = {
  assignedDeveloperId?: string | null;
  skillIds?: string[];
  status?: TaskStatus;
};
