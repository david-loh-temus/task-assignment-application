import type { NextFunction, RequestHandler } from 'express';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { TaskStatus } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

import { createNextMock, createResponseMock } from '../../../shared/__test__/helpers';

type ControllerExports = {
  listDevelopers: RequestHandler;
  getDeveloper: RequestHandler;
};

type DocsModule = {
  getOpenApiSpec: () => { paths: Record<string, unknown> };
};

async function loadDevelopersModule({
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
      developer: {
        findMany,
        findUnique,
      },
    },
  }));

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const controllerModule = require('../developers.controller') as typeof import('../developers.controller');
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

describe('developers.routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the developers collection in the shared data envelope', async () => {
    const { default: controllerDefault, databaseDouble } = await loadDevelopersModule({
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
              displayId: 12,
              id: 'task-1',
              status: TaskStatus.IN_PROGRESS,
              title: 'Responsive homepage',
            },
          ],
          updatedAt: new Date('2026-03-18T01:00:00.000Z'),
        },
        {
          createdAt: new Date('2026-03-18T00:00:00.000Z'),
          id: 'dev-2',
          name: 'Bob',
          skills: [],
          tasks: [],
          updatedAt: new Date('2026-03-18T01:00:00.000Z'),
        },
      ],
    });
    const response = createResponseMock();
    const next = createNextMock() as unknown as NextFunction;

    await controllerDefault.listDevelopers({} as never, response, next);

    expect(response.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(response.json).toHaveBeenCalledWith({
      data: [
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
              displayId: 12,
              id: 'task-1',
              status: TaskStatus.IN_PROGRESS,
              title: 'Responsive homepage',
            },
          ],
          updatedAt: '2026-03-18T01:00:00.000Z',
        },
        {
          createdAt: '2026-03-18T00:00:00.000Z',
          id: 'dev-2',
          name: 'Bob',
          skills: [],
          tasks: [],
          updatedAt: '2026-03-18T01:00:00.000Z',
        },
      ],
    });
    expect(databaseDouble.findMany).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns a single developer by id', async () => {
    const { default: controllerDefault, databaseDouble } = await loadDevelopersModule({
      findUniqueImplementation: async ({ where }) => ({
        createdAt: new Date('2026-03-18T00:00:00.000Z'),
        id: where.id,
        name: 'Carol',
        skills: [],
        tasks: [],
        updatedAt: new Date('2026-03-18T01:00:00.000Z'),
      }),
    });
    const response = createResponseMock();
    const next = createNextMock() as unknown as NextFunction;

    await controllerDefault.getDeveloper(
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
        name: 'Carol',
        skills: [],
        tasks: [],
        updatedAt: '2026-03-18T01:00:00.000Z',
      },
    });
    expect(databaseDouble.findUnique).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
  });

  it('throws a not found error when the developer does not exist', async () => {
    const { default: controllerDefault } = await loadDevelopersModule();
    const response = createResponseMock();
    const next = createNextMock() as unknown as NextFunction;

    await expect(
      controllerDefault.getDeveloper(
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
      message: 'Developer not found',
      status: StatusCodes.NOT_FOUND,
    });
    expect(response.status).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('throws a bad request error when the developer id is not a uuid', async () => {
    const { default: controllerDefault } = await loadDevelopersModule();
    const response = createResponseMock();
    const next = createNextMock() as unknown as NextFunction;

    await expect(
      controllerDefault.getDeveloper(
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
      message: 'Developer id must be a valid UUID',
      status: StatusCodes.BAD_REQUEST,
    });

    expect(response.status).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('publishes developer docs in the generated OpenAPI spec', async () => {
    const { docsModule } = await loadDevelopersModule();

    const spec = docsModule.getOpenApiSpec();

    expect(spec.paths['/developers']).toBeDefined();
    expect(spec.paths['/developers/{id}']).toBeDefined();
  });
});
