import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { TaskStatus } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

type DatabaseDouble = {
  developer: {
    findUnique: jest.Mock;
  };
  skill: {
    findMany: jest.Mock;
  };
  task: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  $transaction: jest.Mock;
};

async function loadTasksService({
  developerFindUniqueImplementation,
  skillFindManyImplementation,
  taskCreateImplementation,
  taskFindManyImplementation,
  taskFindUniqueImplementation,
  taskUpdateImplementation,
  transactionImplementation,
}: {
  developerFindUniqueImplementation?: () => Promise<unknown>;
  skillFindManyImplementation?: () => Promise<unknown>;
  taskCreateImplementation?: () => Promise<unknown>;
  taskFindManyImplementation?: () => Promise<unknown>;
  taskFindUniqueImplementation?: () => Promise<unknown>;
  taskUpdateImplementation?: () => Promise<unknown>;
  transactionImplementation?: (callback: (database: DatabaseDouble) => Promise<unknown>) => Promise<unknown>;
} = {}) {
  jest.resetModules();

  const databaseDouble: DatabaseDouble = {
    $transaction: jest.fn(
      transactionImplementation ??
        (async (callback: (database: DatabaseDouble) => Promise<unknown>) => callback(databaseDouble)),
    ),
    developer: {
      findUnique: jest.fn(developerFindUniqueImplementation),
    },
    skill: {
      findMany: jest.fn(skillFindManyImplementation),
    },
    task: {
      create: jest.fn(taskCreateImplementation),
      findMany: jest.fn(taskFindManyImplementation),
      findUnique: jest.fn(taskFindUniqueImplementation),
      update: jest.fn(taskUpdateImplementation),
    },
  };

  jest.doMock('../../../db/database', () => ({
    __esModule: true,
    db: databaseDouble,
  }));

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const serviceModule = require('../tasks.service') as typeof import('../tasks.service');

  return {
    ...serviceModule,
    databaseDouble,
  };
}

describe('tasks.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns tasks with inline developer and skills', async () => {
    const { databaseDouble, getTasks } = await loadTasksService({
      taskFindManyImplementation: async () => [
        {
          assignedDeveloper: {
            id: 'dev-1',
            name: 'Alice',
          },
          createdAt: new Date('2026-03-18T00:00:00.000Z'),
          description: 'Implement the task module',
          displayId: 10,
          id: 'task-1',
          skills: [
            {
              skill: {
                id: 'skill-1',
                name: 'Backend',
              },
            },
          ],
          status: TaskStatus.TODO,
          title: 'Build API',
          updatedAt: new Date('2026-03-18T01:00:00.000Z'),
        },
      ],
    });

    await expect(getTasks()).resolves.toEqual([
      {
        assignedDeveloper: {
          id: 'dev-1',
          name: 'Alice',
        },
        createdAt: '2026-03-18T00:00:00.000Z',
        description: 'Implement the task module',
        displayId: 10,
        id: 'task-1',
        skills: [
          {
            id: 'skill-1',
            name: 'Backend',
          },
        ],
        status: TaskStatus.TODO,
        title: 'Build API',
        updatedAt: '2026-03-18T01:00:00.000Z',
      },
    ]);
    expect(databaseDouble.task.findMany).toHaveBeenCalledWith({
      include: {
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
      },
      orderBy: {
        displayId: 'asc',
      },
    });
  });

  it('returns a single task when present', async () => {
    const { databaseDouble, getTaskById } = await loadTasksService({
      taskFindUniqueImplementation: async () => ({
        assignedDeveloper: null,
        createdAt: new Date('2026-03-18T00:00:00.000Z'),
        description: null,
        displayId: 11,
        id: 'task-1',
        skills: [],
        status: TaskStatus.IN_PROGRESS,
        title: 'Build API',
        updatedAt: new Date('2026-03-18T01:00:00.000Z'),
      }),
    });

    await expect(getTaskById('task-1')).resolves.toEqual({
      assignedDeveloper: null,
      createdAt: '2026-03-18T00:00:00.000Z',
      description: null,
      displayId: 11,
      id: 'task-1',
      skills: [],
      status: TaskStatus.IN_PROGRESS,
      title: 'Build API',
      updatedAt: '2026-03-18T01:00:00.000Z',
    });
    expect(databaseDouble.task.findUnique).toHaveBeenCalledWith({
      include: {
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
      },
      where: {
        id: 'task-1',
      },
    });
  });

  it('throws a not found error when the task does not exist', async () => {
    const { getTaskById } = await loadTasksService({
      taskFindUniqueImplementation: async () => null,
    });

    await expect(getTaskById('missing-id')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Task not found',
      status: StatusCodes.NOT_FOUND,
    });
  });

  it('creates a task with no relations', async () => {
    const { createTask, databaseDouble } = await loadTasksService({
      skillFindManyImplementation: async () => [],
      taskCreateImplementation: async () => ({
        assignedDeveloper: null,
        createdAt: new Date('2026-03-18T00:00:00.000Z'),
        description: null,
        displayId: 12,
        id: 'task-1',
        skills: [],
        status: TaskStatus.TODO,
        title: 'Build API',
        updatedAt: new Date('2026-03-18T01:00:00.000Z'),
      }),
    });

    await expect(
      createTask({
        title: 'Build API',
      }),
    ).resolves.toEqual({
      assignedDeveloper: null,
      createdAt: '2026-03-18T00:00:00.000Z',
      description: null,
      displayId: 12,
      id: 'task-1',
      skills: [],
      status: TaskStatus.TODO,
      title: 'Build API',
      updatedAt: '2026-03-18T01:00:00.000Z',
    });
    expect(databaseDouble.task.create).toHaveBeenCalledWith({
      data: {
        title: 'Build API',
      },
      include: {
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
      },
    });
  });

  it('creates a task with skills and an assigned developer when they are compatible', async () => {
    const { createTask, databaseDouble } = await loadTasksService({
      developerFindUniqueImplementation: async () => ({
        id: 'dev-1',
        skills: [
          {
            skillId: 'skill-1',
          },
        ],
      }),
      skillFindManyImplementation: async () => [
        {
          id: 'skill-1',
        },
      ],
      taskCreateImplementation: async () => ({
        assignedDeveloper: {
          id: 'dev-1',
          name: 'Alice',
        },
        createdAt: new Date('2026-03-18T00:00:00.000Z'),
        description: 'Implement the task module',
        displayId: 13,
        id: 'task-1',
        skills: [
          {
            skill: {
              id: 'skill-1',
              name: 'Backend',
            },
          },
        ],
        status: TaskStatus.TODO,
        title: 'Build API',
        updatedAt: new Date('2026-03-18T01:00:00.000Z'),
      }),
    });

    await expect(
      createTask({
        assignedDeveloperId: 'dev-1',
        description: 'Implement the task module',
        skillIds: ['skill-1'],
        title: 'Build API',
      }),
    ).resolves.toMatchObject({
      assignedDeveloper: {
        id: 'dev-1',
        name: 'Alice',
      },
      description: 'Implement the task module',
      displayId: 13,
      id: 'task-1',
      status: TaskStatus.TODO,
      title: 'Build API',
    });
    expect(databaseDouble.developer.findUnique).toHaveBeenCalledWith({
      select: {
        id: true,
        skills: {
          select: {
            skillId: true,
          },
        },
      },
      where: {
        id: 'dev-1',
      },
    });
    expect(databaseDouble.skill.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
      },
      where: {
        id: {
          in: ['skill-1'],
        },
      },
    });
    expect(databaseDouble.task.create).toHaveBeenCalledWith({
      data: {
        assignedDeveloperId: 'dev-1',
        description: 'Implement the task module',
        skills: {
          create: [
            {
              skillId: 'skill-1',
            },
          ],
        },
        title: 'Build API',
      },
      include: {
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
      },
    });
  });

  it('rejects task creation when the assigned developer does not exist', async () => {
    const { createTask } = await loadTasksService({
      developerFindUniqueImplementation: async () => null,
    });

    await expect(
      createTask({
        assignedDeveloperId: 'dev-1',
        title: 'Build API',
      }),
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Developer not found',
      status: StatusCodes.NOT_FOUND,
    });
  });

  it('rejects task creation when a required skill does not exist', async () => {
    const { createTask } = await loadTasksService({
      skillFindManyImplementation: async () => [
        {
          id: 'skill-1',
        },
      ],
    });

    await expect(
      createTask({
        skillIds: ['skill-1', 'skill-2'],
        title: 'Build API',
      }),
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'One or more skills were not found',
      status: StatusCodes.NOT_FOUND,
    });
  });

  it('rejects task creation when the assigned developer lacks a required skill', async () => {
    const { createTask } = await loadTasksService({
      developerFindUniqueImplementation: async () => ({
        id: 'dev-1',
        skills: [],
      }),
      skillFindManyImplementation: async () => [
        {
          id: 'skill-1',
        },
      ],
    });

    await expect(
      createTask({
        assignedDeveloperId: 'dev-1',
        skillIds: ['skill-1'],
        title: 'Build API',
      }),
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Assigned developer does not have all required skills',
      status: StatusCodes.BAD_REQUEST,
    });
  });

  it('updates task status, skills, and assignment', async () => {
    const existingTask = {
      assignedDeveloperId: null,
      id: 'task-1',
      skills: [],
    };

    const { databaseDouble, updateTaskById } = await loadTasksService({
      developerFindUniqueImplementation: async () => ({
        id: 'dev-1',
        skills: [
          {
            skillId: 'skill-1',
          },
        ],
      }),
      skillFindManyImplementation: async () => [
        {
          id: 'skill-1',
        },
      ],
      taskFindUniqueImplementation: async () => existingTask,
      taskUpdateImplementation: async () => ({
        assignedDeveloper: {
          id: 'dev-1',
          name: 'Alice',
        },
        createdAt: new Date('2026-03-18T00:00:00.000Z'),
        description: null,
        displayId: 14,
        id: 'task-1',
        skills: [
          {
            skill: {
              id: 'skill-1',
              name: 'Backend',
            },
          },
        ],
        status: TaskStatus.DONE,
        title: 'Build API',
        updatedAt: new Date('2026-03-18T01:00:00.000Z'),
      }),
    });

    await expect(
      updateTaskById('task-1', {
        assignedDeveloperId: 'dev-1',
        skillIds: ['skill-1'],
        status: TaskStatus.DONE,
      }),
    ).resolves.toMatchObject({
      assignedDeveloper: {
        id: 'dev-1',
        name: 'Alice',
      },
      displayId: 14,
      id: 'task-1',
      status: TaskStatus.DONE,
    });
    expect(databaseDouble.$transaction).toHaveBeenCalledTimes(1);
    expect(databaseDouble.task.update).toHaveBeenCalledWith({
      data: {
        assignedDeveloperId: 'dev-1',
        skills: {
          create: [
            {
              skillId: 'skill-1',
            },
          ],
          deleteMany: {},
        },
        status: TaskStatus.DONE,
      },
      include: {
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
      },
      where: {
        id: 'task-1',
      },
    });
  });

  it('unassigns a task and clears skills', async () => {
    const { updateTaskById } = await loadTasksService({
      taskFindUniqueImplementation: async () => ({
        assignedDeveloperId: 'dev-1',
        id: 'task-1',
        skills: [
          {
            skillId: 'skill-1',
          },
        ],
      }),
      taskUpdateImplementation: async () => ({
        assignedDeveloper: null,
        createdAt: new Date('2026-03-18T00:00:00.000Z'),
        description: null,
        displayId: 15,
        id: 'task-1',
        skills: [],
        status: TaskStatus.TODO,
        title: 'Build API',
        updatedAt: new Date('2026-03-18T01:00:00.000Z'),
      }),
    });

    await expect(
      updateTaskById('task-1', {
        assignedDeveloperId: null,
        skillIds: [],
      }),
    ).resolves.toMatchObject({
      assignedDeveloper: null,
      skills: [],
    });
  });

  it('rejects a task update when the assigned developer lacks a required skill', async () => {
    const { updateTaskById } = await loadTasksService({
      developerFindUniqueImplementation: async () => ({
        id: 'dev-1',
        skills: [],
      }),
      skillFindManyImplementation: async () => [
        {
          id: 'skill-1',
        },
      ],
      taskFindUniqueImplementation: async () => ({
        assignedDeveloperId: null,
        id: 'task-1',
        skills: [],
      }),
    });

    await expect(
      updateTaskById('task-1', {
        assignedDeveloperId: 'dev-1',
        skillIds: ['skill-1'],
      }),
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Assigned developer does not have all required skills',
      status: StatusCodes.BAD_REQUEST,
    });
  });
});
