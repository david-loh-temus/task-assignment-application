import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { TaskStatus } from '@prisma/client';
import type { NextFunction, RequestHandler } from 'express';
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
  queryRawImplementation,
  updateTaskImplementation,
}: {
  createTaskImplementation?: () => Promise<unknown>;
  findManyImplementation?: () => Promise<unknown>;
  findUniqueImplementation?: (args: { where: { id: string } }) => Promise<unknown>;
  queryRawImplementation?: () => Promise<unknown>;
  updateTaskImplementation?: () => Promise<unknown>;
} = {}) {
  jest.resetModules();

  const create = jest.fn(createTaskImplementation);
  const findMany = jest.fn(findManyImplementation ?? (async () => []));
  const findUnique = jest.fn(
    findUniqueImplementation ??
      (async (args: { where: { id: string } }) => {
        // Default mock for parent task validation - return a valid parent task
        if (args.where.id.startsWith('10000000')) {
          return { id: args.where.id, parentTaskId: null };
        }
        return null;
      }),
  );
  const queryRaw = jest.fn(queryRawImplementation ?? (async () => []));
  const update = jest.fn(updateTaskImplementation);

  jest.doMock('../../../db/database', () => ({
    __esModule: true,
    db: {
      $queryRaw: queryRaw,
      $transaction: jest.fn(async (callback: (database: unknown) => Promise<unknown>) =>
        callback({
          developer: {
            findUnique: jest.fn(),
          },
          skill: {
            findMany: jest.fn(async () => []),
            upsert: jest.fn(async (args: { where: { name?: string; normalizedName?: string } }) => ({
              id: `skill-${args.where.normalizedName ?? args.where.name}`,
              name: args.where.name ?? 'Backend',
              normalizedName: args.where.normalizedName ?? 'backend',
            })),
          },
          task: {
            create,
            update,
          },
        }),
      ),
      developer: {
        findUnique: jest.fn(),
      },
      skill: {
        findMany: jest.fn(async () => []),
      },
      task: {
        create,
        findMany,
        findUnique,
        update,
      },
    },
  }));

  jest.doMock('../../ai/ai.service', () => ({
    __esModule: true,
    classifyTaskSkills: jest.fn(async () => [{ name: 'Backend', normalizedName: 'backend', source: 'existing' }]),
  }));

  jest.doMock('../../skills/skills.service', () => {
    const actualModule = jest.requireActual(
      '../../skills/skills.service',
    ) as typeof import('../../skills/skills.service');

    return {
      __esModule: true,
      ...actualModule,
      getSkillNamesForAi: jest.fn(async () => ['Backend', 'Frontend']),
    };
  });

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
          parentTask: null,
          skills: [
            {
              skill: {
                id: 'skill-1',
                name: 'Backend',
              },
            },
          ],
          status: TaskStatus.TODO,
          subtasks: [],
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
          parentTask: null,
          skills: [
            {
              id: 'skill-1',
              name: 'Backend',
            },
          ],
          status: TaskStatus.TODO,
          subtasks: [],
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
        parentTask: null,
        skills: [],
        status: TaskStatus.IN_PROGRESS,
        subtasks: [],
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
        parentTask: null,
        skills: [],
        status: TaskStatus.IN_PROGRESS,
        subtasks: [],
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
        parentTask: null,
        skills: [],
        status: TaskStatus.TODO,
        subtasks: [],
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
        parentTask: null,
        skills: [],
        status: TaskStatus.TODO,
        subtasks: [],
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
        parentTask: null,
        skills: [],
        status: TaskStatus.DONE,
        subtasks: [],
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
        parentTask: null,
        skills: [],
        status: TaskStatus.DONE,
        subtasks: [],
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

  describe('sub-tasks hierarchy integration', () => {
    it('creates a sub-task with parent task ID in request body', async () => {
      const { databaseDouble, default: controllerDefault } = await loadTasksModule({
        createTaskImplementation: async () => ({
          assignedDeveloper: null,
          createdAt: new Date('2026-03-18T00:00:00.000Z'),
          description: null,
          displayId: 20,
          id: '20000000-0000-4000-8000-000000000001',
          parentTask: {
            displayId: 10,
            id: '10000000-0000-4000-8000-000000000001',
            title: 'Parent Task',
          },
          skills: [],
          status: TaskStatus.TODO,
          subtasks: [],
          title: 'Sub Task',
          updatedAt: new Date('2026-03-18T01:00:00.000Z'),
        }),
      });
      const response = createResponseMock();
      const next = createNextMock() as unknown as NextFunction;

      await controllerDefault.createTask(
        {
          body: {
            parentTaskId: '10000000-0000-4000-8000-000000000001',
            title: 'Sub Task',
          },
        } as never,
        response,
        next,
      );

      expect(response.status).toHaveBeenCalledWith(StatusCodes.CREATED);
      expect(response.json).toHaveBeenCalledWith({
        data: expect.objectContaining({
          displayId: 20,
          id: '20000000-0000-4000-8000-000000000001',
          parentTask: {
            displayId: 10,
            id: '10000000-0000-4000-8000-000000000001',
            title: 'Parent Task',
          },
          title: 'Sub Task',
        }),
      });
      expect(databaseDouble.create).toHaveBeenCalledTimes(1);
    });

    it('returns full nested hierarchy when retrieving task with subtasks', async () => {
      const { databaseDouble, default: controllerDefault } = await loadTasksModule({
        findUniqueImplementation: async () => ({
          assignedDeveloper: null,
          createdAt: new Date('2026-03-18T00:00:00.000Z'),
          description: null,
          displayId: 10,
          id: '10000000-0000-4000-8000-000000000002',
          parentTask: null,
          skills: [],
          status: TaskStatus.TODO,
          subtasks: [
            {
              assignedDeveloper: null,
              createdAt: new Date('2026-03-18T00:00:00.000Z'),
              description: null,
              displayId: 20,
              id: '20000000-0000-4000-8000-000000000002',
              parentTask: {
                displayId: 10,
                id: '10000000-0000-4000-8000-000000000002',
                title: 'Parent Task',
              },
              skills: [],
              status: TaskStatus.TODO,
              subtasks: [
                {
                  assignedDeveloper: null,
                  createdAt: new Date('2026-03-18T00:00:00.000Z'),
                  description: null,
                  displayId: 30,
                  id: '30000000-0000-4000-8000-000000000002',
                  parentTask: {
                    displayId: 20,
                    id: '20000000-0000-4000-8000-000000000002',
                    title: 'Child Task',
                  },
                  skills: [],
                  status: TaskStatus.TODO,
                  subtasks: [],
                  title: 'Grandchild Task',
                  updatedAt: new Date('2026-03-18T00:00:00.000Z'),
                },
              ],
              title: 'Child Task',
              updatedAt: new Date('2026-03-18T00:00:00.000Z'),
            },
          ],
          title: 'Parent Task',
          updatedAt: new Date('2026-03-18T01:00:00.000Z'),
        }),
      });
      const response = createResponseMock();
      const next = createNextMock() as unknown as NextFunction;

      await controllerDefault.getTask(
        {
          params: {
            id: '10000000-0000-4000-8000-000000000002',
          },
        } as never,
        response,
        next,
      );

      expect(response.status).toHaveBeenCalledWith(StatusCodes.OK);
      const responseData = (response.json as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
      expect(responseData.data).toMatchObject({
        displayId: 10,
        id: '10000000-0000-4000-8000-000000000002',
        title: 'Parent Task',
        parentTask: null,
        subtasks: expect.arrayContaining([
          expect.objectContaining({
            displayId: 20,
            id: '20000000-0000-4000-8000-000000000002',
            title: 'Child Task',
            subtasks: expect.arrayContaining([
              expect.objectContaining({
                displayId: 30,
                id: '30000000-0000-4000-8000-000000000002',
                title: 'Grandchild Task',
                subtasks: [],
              }),
            ]),
          }),
        ]),
      });
    });

    it('updates task to add parentTaskId', async () => {
      const { databaseDouble, default: controllerDefault } = await loadTasksModule({
        findUniqueImplementation: async (args: { where: { id: string } }) => {
          // Return parent task details if looking up parent
          if (args.where.id === '10000000-0000-4000-8000-000000000099') {
            return {
              id: '10000000-0000-4000-8000-000000000099',
              parentTaskId: null,
            };
          }
          // Return task being updated
          return {
            assignedDeveloperId: null,
            id: '11111111-0000-4000-8000-000000000003',
            parentTaskId: null,
            skills: [],
            status: TaskStatus.TODO,
            subtasks: [],
          };
        },
        updateTaskImplementation: async () => ({
          assignedDeveloper: null,
          createdAt: new Date('2026-03-18T00:00:00.000Z'),
          description: null,
          displayId: 11,
          id: '11111111-0000-4000-8000-000000000003',
          parentTask: {
            displayId: 99,
            id: '10000000-0000-4000-8000-000000000099',
            title: 'Parent Task',
          },
          skills: [],
          status: TaskStatus.TODO,
          subtasks: [],
          title: 'Now a Sub Task',
          updatedAt: new Date('2026-03-18T01:00:00.000Z'),
        }),
      });
      const response = createResponseMock();
      const next = createNextMock() as unknown as NextFunction;

      await controllerDefault.updateTask(
        {
          body: {
            parentTaskId: '10000000-0000-4000-8000-000000000099',
          },
          params: {
            id: '11111111-0000-4000-8000-000000000003',
          },
        } as never,
        response,
        next,
      );

      expect(response.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(response.json).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: '11111111-0000-4000-8000-000000000003',
          parentTask: {
            displayId: 99,
            id: '10000000-0000-4000-8000-000000000099',
            title: 'Parent Task',
          },
        }),
      });
    });

    it('returns 400 error when attempting to mark parent task DONE with incomplete subtasks', async () => {
      const { default: controllerDefault } = await loadTasksModule({
        findUniqueImplementation: async () => ({
          assignedDeveloperId: null,
          id: '10000000-0000-4000-8000-000000000004',
          parentTaskId: null,
          skills: [],
          status: TaskStatus.IN_PROGRESS,
          subtasks: [
            {
              id: '20000000-0000-4000-8000-000000000004',
              status: TaskStatus.TODO,
            },
          ],
        }),
        queryRawImplementation: async () => [{ id: '20000000-0000-4000-8000-000000000004' }],
      });
      const response = createResponseMock();
      const next = createNextMock() as unknown as NextFunction;

      await expect(
        controllerDefault.updateTask(
          {
            body: {
              status: TaskStatus.DONE,
            },
            params: {
              id: '10000000-0000-4000-8000-000000000004',
            },
          } as never,
          response,
          next,
        ),
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: expect.stringContaining('Cannot mark task as DONE'),
        status: StatusCodes.BAD_REQUEST,
      });
    });
  });
});
