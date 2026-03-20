import type { Prisma, TaskStatus } from '@prisma/client';

// Skill selection for nested relationships
const skillSelect = {
  id: true,
  name: true,
};

// Developer selection for nested relationships
const developerSelect = {
  id: true,
  name: true,
};

// Skills include config for nested relationships
const skillsInclude = {
  include: {
    skill: {
      select: skillSelect,
    },
  },
  orderBy: {
    skill: {
      name: 'asc' as const,
    },
  },
};

// Level 2 (sub-subtask) include - no deeper nesting
const level2SubtaskSelect = {
  id: true,
  displayId: true,
  title: true,
  description: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  assignedDeveloper: {
    select: developerSelect,
  },
  skills: skillsInclude,
};

// Level 1 (subtask) include - includes level 2 subtasks
const level1SubtaskSelect = {
  id: true,
  displayId: true,
  title: true,
  description: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  assignedDeveloper: {
    select: developerSelect,
  },
  skills: skillsInclude,
  subtasks: {
    select: level2SubtaskSelect,
  },
};

export const taskReadInclude = {
  assignedDeveloper: {
    select: developerSelect,
  },
  skills: skillsInclude,
  parentTask: {
    select: {
      id: true,
      displayId: true,
      title: true,
    },
  },
  subtasks: {
    select: level1SubtaskSelect,
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

/**
 * Recursive type representing a subtask with nested subtasks.
 * Matches the structure returned by Prisma with taskReadInclude for recursive mapping.
 */
export interface SubtaskRecord {
  id: string;
  displayId: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  assignedDeveloper: {
    id: string;
    name: string;
  } | null;
  skills: Array<{
    skill: {
      id: string;
      name: string;
    };
  }>;
  subtasks?: SubtaskRecord[];
}

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
