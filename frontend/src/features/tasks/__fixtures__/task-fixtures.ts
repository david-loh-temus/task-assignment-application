import type { Task } from '@features/tasks/types/task';

export const taskFixture: Task = {
  id: 'task-1',
  displayId: 1,
  title: 'Build tasks page',
  description: 'Implement the read path',
  status: 'TODO',
  assignedDeveloper: {
    id: 'developer-1',
    name: 'Ada Lovelace',
  },
  skills: [
    {
      id: 'skill-1',
      name: 'React',
    },
  ],
  createdAt: '2026-03-19T00:00:00.000Z',
  updatedAt: '2026-03-19T00:00:00.000Z',
};

export const taskCollectionFixture: Task[] = [taskFixture];
