import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { SkillSource } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

type DatabaseDouble = {
  skill: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
  };
};

async function loadSkillsService({
  findManyImplementation,
  findUniqueImplementation,
}: {
  findManyImplementation?: () => Promise<unknown>;
  findUniqueImplementation?: () => Promise<unknown>;
} = {}) {
  jest.resetModules();

  const databaseDouble: DatabaseDouble = {
    skill: {
      findMany: jest.fn(findManyImplementation),
      findUnique: jest.fn(findUniqueImplementation),
    },
  };

  jest.doMock('../../../db/database', () => ({
    __esModule: true,
    db: databaseDouble,
  }));

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const serviceModule = require('../skills.service') as typeof import('../skills.service');

  return {
    ...serviceModule,
    databaseDouble,
  };
}

describe('skills.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns skills with core fields mapped for the API', async () => {
    const { getSkills, databaseDouble } = await loadSkillsService({
      findManyImplementation: async () => [
        {
          createdAt: new Date('2026-03-18T00:00:00.000Z'),
          id: 'skill-1',
          name: 'Backend',
          source: SkillSource.HUMAN,
          updatedAt: new Date('2026-03-18T01:00:00.000Z'),
        },
      ],
    });

    await expect(getSkills()).resolves.toEqual([
      {
        createdAt: '2026-03-18T00:00:00.000Z',
        id: 'skill-1',
        name: 'Backend',
        source: SkillSource.HUMAN,
        updatedAt: '2026-03-18T01:00:00.000Z',
      },
    ]);
    expect(databaseDouble.skill.findMany).toHaveBeenCalledWith({
      orderBy: {
        name: 'asc',
      },
      select: {
        createdAt: true,
        id: true,
        name: true,
        source: true,
        updatedAt: true,
      },
    });
  });

  it('returns a single skill when present', async () => {
    const { getSkillById, databaseDouble } = await loadSkillsService({
      findUniqueImplementation: async () => ({
        createdAt: new Date('2026-03-18T00:00:00.000Z'),
        id: 'skill-1',
        name: 'Backend',
        source: SkillSource.LLM,
        updatedAt: new Date('2026-03-18T01:00:00.000Z'),
      }),
    });

    await expect(getSkillById('skill-1')).resolves.toEqual({
      createdAt: '2026-03-18T00:00:00.000Z',
      id: 'skill-1',
      name: 'Backend',
      source: SkillSource.LLM,
      updatedAt: '2026-03-18T01:00:00.000Z',
    });
    expect(databaseDouble.skill.findUnique).toHaveBeenCalledWith({
      select: {
        createdAt: true,
        id: true,
        name: true,
        source: true,
        updatedAt: true,
      },
      where: {
        id: 'skill-1',
      },
    });
  });

  it('throws a not found error when the skill does not exist', async () => {
    const { getSkillById } = await loadSkillsService({
      findUniqueImplementation: async () => null,
    });

    await expect(getSkillById('missing-id')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Skill not found',
      status: StatusCodes.NOT_FOUND,
    });
  });
});
