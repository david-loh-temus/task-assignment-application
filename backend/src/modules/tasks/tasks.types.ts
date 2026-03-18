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
  skills: {
    select: {
      skillId: true,
    },
  },
} satisfies Prisma.TaskSelect;

export type TaskRecord = Prisma.TaskGetPayload<{
  include: typeof taskReadInclude;
}>;

export type TaskValidationRecord = Prisma.TaskGetPayload<{
  select: typeof taskValidationSelect;
}>;

export type TaskReadDto = {
  id: string;
  displayId: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  assignedDeveloper: {
    id: string;
    name: string;
  } | null;
  skills: Array<{
    id: string;
    name: string;
  }>;
  createdAt: string;
  updatedAt: string;
};
