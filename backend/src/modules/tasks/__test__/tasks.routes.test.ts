import type { NextFunction, RequestHandler } from 'express';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { TaskStatus } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

import { createNextMock, createResponseMock } from '../../../shared/__test__/helpers';

type ControllerExports = {
  createTask: RequestHandler;
  getTask: RequestHandler;
  listTasks: RequestHandler;
  updateTask: RequestHandler;
};

type DocsModule = {
  getOpenApiSpec: () => { paths: Record<string, unknown> };
};

async function loadTasksModule({
  createTaskImplementation,
  findManyImplementation,
  findUniqueImplementation,
  updateTaskImplementation,
}: {
  createTaskImplementation?: () => Promise<unknown>;
  findManyImplementation?: () => Promise<unknown>;
  findUniqueImplementation?: (args: { where: { id: string } }) => Promise<unknown>;
  updateTaskImplementation?: () => Promise<unknown>;
} = {}) {
  jest.resetModules();

  const create = jest.fn(createTaskImplementation);
  const findMany = jest.fn(findManyImplementation ?? (async () => []));
  const findUnique = jest.fn(findUniqueImplementation ?? (async () => null));
  const update = jest.fn(updateTaskImplementation);

  jest.doMock('../../../db/database', () => ({
    __esModule: true,
    db: {
      $transaction: jest.fn(async (callback: (database: unknown) => Promise<unknown>) =>
        callback({
          developer: {
            findUnique: jest.fn(),
          },
          skill: {
            findMany: jest.fn(),
          },
          task: {
            update,
          },
        }),
      ),
      developer: {
        findUnique: jest.fn(),
      },
      skill: {
        findMany: jest.fn(),
      },
      task: {
        create,
        findMany,
        findUnique,
        update,
      },
    },
  }));

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const controllerModule = require('../tasks.controller') as typeof import('../tasks.controller');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const docsModule = require('../../../app/swagger') as typeof import('../../../app/swagger');

  const controllerExports = controllerModule && controllerModule.default ? controllerModule.default : controllerModule;

  return {
    databaseDouble: {
      create,
      findMany,
      findUnique,
      update,
    },
    default: controllerExports as unknown as ControllerExports,
    docsModule: docsModule as unknown as DocsModule,
  };
}

describe('tasks.routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the task collection in the shared data envelope', async () => {
    const { databaseDouble, default: controllerDefault } = await loadTasksModule({
      findManyImplementation: async () => [
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
    const response = createResponseMock();
    const next = createNextMock() as unknown as NextFunction;

    await controllerDefault.listTasks({} as never, response, next);

    expect(response.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(response.json).toHaveBeenCalledWith({
      data: [
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
      ],
    });
    expect(databaseDouble.findMany).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns a single task by id', async () => {
    const { databaseDouble, default: controllerDefault } = await loadTasksModule({
      findUniqueImplementation: async ({ where }) => ({
        assignedDeveloper: null,
        createdAt: new Date('2026-03-18T00:00:00.000Z'),
        description: null,
        displayId: 11,
        id: where.id,
        skills: [],
        status: TaskStatus.IN_PROGRESS,
        title: 'Build API',
        updatedAt: new Date('2026-03-18T01:00:00.000Z'),
      }),
    });
    const response = createResponseMock();
    const next = createNextMock() as unknown as NextFunction;

    await controllerDefault.getTask(
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
        assignedDeveloper: null,
        createdAt: '2026-03-18T00:00:00.000Z',
        description: null,
        displayId: 11,
        id: '0f41b698-2a1d-430f-862e-9566cfcf2896',
        skills: [],
        status: TaskStatus.IN_PROGRESS,
        title: 'Build API',
        updatedAt: '2026-03-18T01:00:00.000Z',
      },
    });
    expect(databaseDouble.findUnique).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
  });

  it('creates a task and returns the created response envelope', async () => {
    const { databaseDouble, default: controllerDefault } = await loadTasksModule({
      createTaskImplementation: async () => ({
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
    const response = createResponseMock();
    const next = createNextMock() as unknown as NextFunction;

    await controllerDefault.createTask(
      {
        body: {
          title: 'Build API',
        },
      } as never,
      response,
      next,
    );

    expect(response.status).toHaveBeenCalledWith(StatusCodes.CREATED);
    expect(response.json).toHaveBeenCalledWith({
      data: {
        assignedDeveloper: null,
        createdAt: '2026-03-18T00:00:00.000Z',
        description: null,
        displayId: 12,
        id: 'task-1',
        skills: [],
        status: TaskStatus.TODO,
        title: 'Build API',
        updatedAt: '2026-03-18T01:00:00.000Z',
      },
    });
    expect(databaseDouble.create).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
  });

  it('updates a task and returns the shared data envelope', async () => {
    const { databaseDouble, default: controllerDefault } = await loadTasksModule({
      findUniqueImplementation: async () => ({
        assignedDeveloperId: null,
        id: 'task-1',
        skills: [],
      }),
      updateTaskImplementation: async () => ({
        assignedDeveloper: {
          id: 'dev-1',
          name: 'Alice',
        },
        createdAt: new Date('2026-03-18T00:00:00.000Z'),
        description: null,
        displayId: 13,
        id: 'task-1',
        skills: [],
        status: TaskStatus.DONE,
        title: 'Build API',
        updatedAt: new Date('2026-03-18T01:00:00.000Z'),
      }),
    });
    const response = createResponseMock();
    const next = createNextMock() as unknown as NextFunction;

    await controllerDefault.updateTask(
      {
        body: {
          assignedDeveloperId: null,
          status: TaskStatus.DONE,
        },
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
        assignedDeveloper: {
          id: 'dev-1',
          name: 'Alice',
        },
        createdAt: '2026-03-18T00:00:00.000Z',
        description: null,
        displayId: 13,
        id: 'task-1',
        skills: [],
        status: TaskStatus.DONE,
        title: 'Build API',
        updatedAt: '2026-03-18T01:00:00.000Z',
      },
    });
    expect(databaseDouble.update).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
  });

  it('throws a bad request error when the task id is not a uuid', async () => {
    const { default: controllerDefault } = await loadTasksModule();
    const response = createResponseMock();
    const next = createNextMock() as unknown as NextFunction;

    await expect(
      controllerDefault.getTask(
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
      message: 'Task id must be a valid UUID',
      status: StatusCodes.BAD_REQUEST,
    });

    expect(response.status).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('throws a bad request error when the create payload is invalid', async () => {
    const { default: controllerDefault } = await loadTasksModule();
    const response = createResponseMock();
    const next = createNextMock() as unknown as NextFunction;

    await expect(
      controllerDefault.createTask(
        {
          body: {},
        } as never,
        response,
        next,
      ),
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Task title is required',
      status: StatusCodes.BAD_REQUEST,
    });

    expect(response.status).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('publishes task docs in the generated OpenAPI spec', async () => {
    const { docsModule } = await loadTasksModule();

    const spec = docsModule.getOpenApiSpec();

    expect(spec.paths['/tasks']).toBeDefined();
    expect(spec.paths['/tasks/{id}']).toBeDefined();
  });
});
