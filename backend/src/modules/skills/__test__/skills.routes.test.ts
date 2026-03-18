import type { NextFunction, RequestHandler } from 'express';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { SkillSource } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

import { createNextMock, createResponseMock } from '../../../shared/__test__/helpers';

type ControllerExports = {
  listSkills: RequestHandler;
  getSkill: RequestHandler;
};

type DocsModule = {
  getOpenApiSpec: () => { paths: Record<string, unknown> };
};

async function loadSkillsModule({
  findManyImplementation,
  findUniqueImplementation,
}: {
  findManyImplementation?: () => Promise<unknown>;
  findUniqueImplementation?: (args: { where: { id: string } }) => Promise<unknown>;
} = {}) {
  jest.resetModules();

  const findMany = jest.fn(findManyImplementation ?? (async () => []));
  const findUnique = jest.fn(findUniqueImplementation ?? (async () => null));

  jest.doMock('../../../db/database', () => ({
    __esModule: true,
    db: {
      skill: {
        findMany,
        findUnique,
      },
    },
  }));

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const controllerModule = require('../skills.controller') as typeof import('../skills.controller');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('../skills.routes');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const docsModule = require('../../../app/swagger') as typeof import('../../../app/swagger');

  const controllerExports = controllerModule && controllerModule.default ? controllerModule.default : controllerModule;

  return {
    default: controllerExports as unknown as ControllerExports,
    databaseDouble: {
      findMany,
      findUnique,
    },
    docsModule: docsModule as unknown as DocsModule,
  } as {
    default: ControllerExports;
    databaseDouble: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
    };
    docsModule: DocsModule;
  };
}

describe('skills.routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the skills collection in the shared data envelope', async () => {
    const { default: controllerDefault, databaseDouble } = await loadSkillsModule({
      findManyImplementation: async () => [
        {
          createdAt: new Date('2026-03-18T00:00:00.000Z'),
          id: 'skill-1',
          name: 'Backend',
          source: SkillSource.HUMAN,
          updatedAt: new Date('2026-03-18T01:00:00.000Z'),
        },
        {
          createdAt: new Date('2026-03-18T00:00:00.000Z'),
          id: 'skill-2',
          name: 'Frontend',
          source: SkillSource.LLM,
          updatedAt: new Date('2026-03-18T01:00:00.000Z'),
        },
      ],
    });
    const response = createResponseMock();
    const next = createNextMock() as unknown as NextFunction;

    await controllerDefault.listSkills({} as never, response, next);

    expect(response.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(response.json).toHaveBeenCalledWith({
      data: [
        {
          createdAt: '2026-03-18T00:00:00.000Z',
          id: 'skill-1',
          name: 'Backend',
          source: SkillSource.HUMAN,
          updatedAt: '2026-03-18T01:00:00.000Z',
        },
        {
          createdAt: '2026-03-18T00:00:00.000Z',
          id: 'skill-2',
          name: 'Frontend',
          source: SkillSource.LLM,
          updatedAt: '2026-03-18T01:00:00.000Z',
        },
      ],
    });
    expect(databaseDouble.findMany).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns a single skill by id', async () => {
    const { default: controllerDefault, databaseDouble } = await loadSkillsModule({
      findUniqueImplementation: async ({ where }) => ({
        createdAt: new Date('2026-03-18T00:00:00.000Z'),
        id: where.id,
        name: 'Backend',
        source: SkillSource.HUMAN,
        updatedAt: new Date('2026-03-18T01:00:00.000Z'),
      }),
    });
    const response = createResponseMock();
    const next = createNextMock() as unknown as NextFunction;

    await controllerDefault.getSkill(
      {
        params: {
          id: '0f41b698-2a1d-430f-862e-9566cfcf2896',
        },
      } as never,
      response,
      next,
    );

    expect(response.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(response.json).toHaveBeenCalledWith({
      data: {
        createdAt: '2026-03-18T00:00:00.000Z',
        id: '0f41b698-2a1d-430f-862e-9566cfcf2896',
        name: 'Backend',
        source: SkillSource.HUMAN,
        updatedAt: '2026-03-18T01:00:00.000Z',
      },
    });
    expect(databaseDouble.findUnique).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
  });

  it('throws a not found error when the skill does not exist', async () => {
    const { default: controllerDefault } = await loadSkillsModule();
    const response = createResponseMock();
    const next = createNextMock() as unknown as NextFunction;

    await expect(
      controllerDefault.getSkill(
        {
          params: {
            id: '0f41b698-2a1d-430f-862e-9566cfcf2896',
          },
        } as never,
        response,
        next,
      ),
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Skill not found',
      status: StatusCodes.NOT_FOUND,
    });
    expect(response.status).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('throws a bad request error when the skill id is not a uuid', async () => {
    const { default: controllerDefault } = await loadSkillsModule();
    const response = createResponseMock();
    const next = createNextMock() as unknown as NextFunction;

    await expect(
      controllerDefault.getSkill(
        {
          params: {
            id: 'not-a-uuid',
          },
        } as never,
        response,
        next,
      ),
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Skill id must be a valid UUID',
      status: StatusCodes.BAD_REQUEST,
    });

    expect(response.status).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('publishes skill docs in the generated OpenAPI spec', async () => {
    const { docsModule } = await loadSkillsModule();

    const spec = docsModule.getOpenApiSpec();

    expect(spec.paths['/skills']).toBeDefined();
    expect(spec.paths['/skills/{id}']).toBeDefined();
  });
});
