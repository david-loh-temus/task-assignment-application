import type { Prisma, TaskStatus } from '@prisma/client';

export const taskReadInclude = {
  assignedDeveloper: {
    select: {
      id: true,
      name: true,
    },
  },
  skills: {
    include: {
      skill: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      skill: {
        name: 'asc',
      },
    },
  },
  parentTask: {
    select: {
      id: true,
      displayId: true,
      title: true,
    },
  },
  subtasks: {
    select: {
      id: true,
      displayId: true,
      title: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} satisfies Prisma.TaskInclude;

export const taskValidationDeveloperSelect = {
  id: true,
  skills: {
    select: {
      skillId: true,
    },
  },
} satisfies Prisma.DeveloperSelect;

export const taskValidationSkillSelect = {
  id: true,
} satisfies Prisma.SkillSelect;

export const taskValidationSelect = {
  assignedDeveloperId: true,
  id: true,
  parentTaskId: true,
  skills: {
    select: {
      skillId: true,
    },
  },
  status: true,
  subtasks: {
    select: {
      id: true,
      status: true,
    },
  },
} satisfies Prisma.TaskSelect;

export const taskValidationParentSelect = {
  id: true,
  parentTaskId: true,
} satisfies Prisma.TaskSelect;

export type TaskRecord = Prisma.TaskGetPayload<{
  include: typeof taskReadInclude;
}>;

export type TaskValidationRecord = Prisma.TaskGetPayload<{
  select: typeof taskValidationSelect;
}>;

export interface TaskReadDto {
  id: string;
  displayId: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  assignedDeveloper: {
    id: string;
    name: string;
  } | null;
  parentTask: {
    id: string;
    displayId: number;
    title: string;
  } | null;
  subtasks: TaskReadDto[];
  skills: Array<{
    id: string;
    name: string;
  }>;
  createdAt: string;
  updatedAt: string;
}
