import { TaskStatus } from '@prisma/client';

/**
 * Test fixtures for tasks module
 * These are sample data objects used across multiple tests
 *
 * UUID Naming Convention:
 * - Task UUIDs: 11111111-1111-1111-1111-[displayId padded]
 * - Developer UUIDs: 22222222-2222-2222-2222-000000000001
 * - Skill UUIDs: 33333333-3333-3333-3333-000000000001
 */

// Reusable select/include patterns for Prisma queries
const developerSelect = {
  select: {
    id: true,
    name: true,
  },
};

const skillsInclude = {
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
};

export const sampleDeveloper = {
  id: '22222222-2222-2222-2222-000000000001',
  name: 'Alice',
};

export const sampleSkill = {
  id: '33333333-3333-3333-3333-000000000001',
  name: 'Backend',
};

export const sampleTaskWithDeveloperAndSkills = {
  assignedDeveloper: sampleDeveloper,
  createdAt: new Date('2026-03-18T00:00:00.000Z'),
  description: 'Implement the task module',
  displayId: 10,
  id: '11111111-1111-1111-1111-000000000010',
  parentTask: null,
  skills: [
    {
      skill: sampleSkill,
    },
  ],
  status: TaskStatus.TODO,
  subtasks: [],
  title: 'Build API',
  updatedAt: new Date('2026-03-18T01:00:00.000Z'),
};

export const sampleTaskWithoutRelations = {
  assignedDeveloper: null,
  createdAt: new Date('2026-03-18T00:00:00.000Z'),
  description: null,
  displayId: 11,
  id: '11111111-1111-1111-1111-000000000011',
  parentTask: null,
  skills: [],
  status: TaskStatus.IN_PROGRESS,
  subtasks: [],
  title: 'Build API',
  updatedAt: new Date('2026-03-18T01:00:00.000Z'),
};

export const sampleParentTask = {
  assignedDeveloper: null,
  createdAt: new Date('2026-03-18T00:00:00.000Z'),
  description: null,
  displayId: 10,
  id: '11111111-1111-1111-1111-000000000010',
  parentTask: null,
  skills: [],
  status: TaskStatus.TODO,
  subtasks: [],
  title: 'Parent Task',
  updatedAt: new Date('2026-03-18T01:00:00.000Z'),
};

export const sampleSubtask = {
  assignedDeveloper: null,
  createdAt: new Date('2026-03-18T00:00:00.000Z'),
  description: null,
  displayId: 20,
  id: '11111111-1111-1111-1111-000000000020',
  parentTask: {
    displayId: 10,
    id: '11111111-1111-1111-1111-000000000010',
    title: 'Parent Task',
  },
  skills: [],
  status: TaskStatus.TODO,
  subtasks: [],
  title: 'Sub Task',
  updatedAt: new Date('2026-03-18T01:00:00.000Z'),
};

export const expectedTaskReadInclude = {
  include: {
    assignedDeveloper: developerSelect,
    parentTask: {
      select: {
        displayId: true,
        id: true,
        title: true,
      },
    },
    skills: skillsInclude,
    subtasks: {
      select: {
        assignedDeveloper: developerSelect,
        createdAt: true,
        description: true,
        displayId: true,
        id: true,
        skills: skillsInclude,
        status: true,
        title: true,
        updatedAt: true,
        subtasks: {
          select: {
            assignedDeveloper: developerSelect,
            createdAt: true,
            description: true,
            displayId: true,
            id: true,
            skills: skillsInclude,
            status: true,
            title: true,
            updatedAt: true,
          },
        },
      },
    },
  },
};
