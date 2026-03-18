import type { Prisma, TaskStatus } from '@prisma/client';

// Include configuration for database queries
export const developerReadInclude = {
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
  tasks: {
    select: {
      displayId: true,
      id: true,
      status: true,
      title: true,
    },
    orderBy: {
      displayId: 'asc',
    },
  },
} satisfies Prisma.DeveloperInclude;

export type DeveloperRecord = Prisma.DeveloperGetPayload<{
  include: typeof developerReadInclude;
}>;

export type DeveloperReadDto = {
  id: string;
  name: string;
  skills: Array<{
    id: string;
    name: string;
  }>;
  tasks: Array<{
    displayId: number;
    id: string;
    status: TaskStatus;
    title: string;
  }>;
  createdAt: string;
  updatedAt: string;
};
