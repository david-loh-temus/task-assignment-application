import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { TaskStatus } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

type DatabaseDouble = {
  developer: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
  };
};

async function loadDevelopersService({
  findManyImplementation,
  findUniqueImplementation,
}: {
  findManyImplementation?: () => Promise<unknown>;
  findUniqueImplementation?: () => Promise<unknown>;
} = {}) {
  jest.resetModules();

  const databaseDouble: DatabaseDouble = {
    developer: {
      findMany: jest.fn(findManyImplementation),
      findUnique: jest.fn(findUniqueImplementation),
    },
  };

  jest.doMock('../../../db/database', () => ({
    __esModule: true,
    db: databaseDouble,
  }));

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const serviceModule = require('../developers.service') as typeof import('../developers.service');

  return {
    ...serviceModule,
    databaseDouble,
  };
}

describe('developers.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns developers with flattened skills and task summaries', async () => {
    const { getDevelopers, databaseDouble } = await loadDevelopersService({
      findManyImplementation: async () => [
        {
          createdAt: new Date('2026-03-18T00:00:00.000Z'),
          id: 'dev-1',
          name: 'Alice',
          skills: [
            {
              skill: {
                id: 'skill-1',
                name: 'Frontend',
              },
            },
          ],
          tasks: [
            {
              displayId: 7,
              id: 'task-1',
              status: TaskStatus.TODO,
              title: 'Build landing page',
            },
          ],
          updatedAt: new Date('2026-03-18T01:00:00.000Z'),
        },
      ],
    });

    await expect(getDevelopers()).resolves.toEqual([
      {
        createdAt: '2026-03-18T00:00:00.000Z',
        id: 'dev-1',
        name: 'Alice',
        skills: [
          {
            id: 'skill-1',
            name: 'Frontend',
          },
        ],
        tasks: [
          {
            displayId: 7,
            id: 'task-1',
            status: TaskStatus.TODO,
            title: 'Build landing page',
          },
        ],
        updatedAt: '2026-03-18T01:00:00.000Z',
      },
    ]);
    expect(databaseDouble.developer.findMany).toHaveBeenCalledWith({
      include: {
        skills: {
          include: {
            skill: {
              select: {
                id: true,
                name: true,
              },
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
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  });

  it('returns a single developer when present', async () => {
    const { getDeveloperById, databaseDouble } = await loadDevelopersService({
      findUniqueImplementation: async () => ({
        createdAt: new Date('2026-03-18T00:00:00.000Z'),
        id: 'dev-1',
        name: 'Alice',
        skills: [],
        tasks: [],
        updatedAt: new Date('2026-03-18T01:00:00.000Z'),
      }),
    });

    await expect(getDeveloperById('dev-1')).resolves.toEqual({
      createdAt: '2026-03-18T00:00:00.000Z',
      id: 'dev-1',
      name: 'Alice',
      skills: [],
      tasks: [],
      updatedAt: '2026-03-18T01:00:00.000Z',
    });
    expect(databaseDouble.developer.findUnique).toHaveBeenCalledWith({
      include: {
        skills: {
          include: {
            skill: {
              select: {
                id: true,
                name: true,
              },
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
        },
      },
      where: {
        id: 'dev-1',
      },
    });
  });

  it('throws a not found error when the developer does not exist', async () => {
    const { getDeveloperById } = await loadDevelopersService({
      findUniqueImplementation: async () => null,
    });

    await expect(getDeveloperById('missing-id')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Developer not found',
      status: StatusCodes.NOT_FOUND,
    });
  });
});
