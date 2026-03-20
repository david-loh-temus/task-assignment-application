import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { TaskStatus } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { loadTasksService } from '../../../__test__/__helpers__/database-test-helper';

describe('tasks.service - Update Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateTaskById', () => {
    it('updates task status, skills, and assignment', async () => {
      // displayId: 14, dev-1, skill-1
      const taskUuid = '11111111-1111-1111-1111-000000000014';
      const devUuid = '22222222-2222-2222-2222-000000000001';
      const skillUuid = '33333333-3333-3333-3333-000000000001';
      const existingTask = {
        assignedDeveloperId: null,
        id: taskUuid,
        skills: [],
      };

      const { databaseDouble, updateTaskById } = await loadTasksService({
        developerFindUniqueImplementation: async () => ({
          id: devUuid,
          skills: [
            {
              skillId: skillUuid,
            },
          ],
        }),
        skillFindManyImplementation: async () => [
          {
            id: skillUuid,
          },
        ],
        taskFindUniqueImplementation: async () => existingTask,
        taskUpdateImplementation: async () => ({
          assignedDeveloper: {
            id: devUuid,
            name: 'Alice',
          },
          createdAt: new Date('2026-03-18T00:00:00.000Z'),
          description: null,
          displayId: 14,
          id: taskUuid,
          parentTask: null,
          skills: [
            {
              skill: {
                id: skillUuid,
                name: 'Backend',
              },
            },
          ],
          status: TaskStatus.DONE,
          subtasks: [],
          title: 'Build API',
          updatedAt: new Date('2026-03-18T01:00:00.000Z'),
        }),
      });

      await expect(
        updateTaskById(taskUuid, {
          assignedDeveloperId: devUuid,
          skillIds: [skillUuid],
          status: TaskStatus.DONE,
        }),
      ).resolves.toMatchObject({
        assignedDeveloper: {
          id: devUuid,
          name: 'Alice',
        },
        displayId: 14,
        id: taskUuid,
        status: TaskStatus.DONE,
      });
      expect(databaseDouble.$transaction).toHaveBeenCalledTimes(1);
      expect(databaseDouble.task.update).toHaveBeenCalledWith({
        data: {
          assignedDeveloperId: devUuid,
          skills: {
            create: [
              {
                skillId: skillUuid,
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
          parentTask: {
            select: {
              displayId: true,
              id: true,
              title: true,
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
          subtasks: {
            select: {
              assignedDeveloper: {
                select: {
                  id: true,
                  name: true,
                },
              },
              createdAt: true,
              description: true,
              displayId: true,
              id: true,
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
              status: true,
              title: true,
              updatedAt: true,
              subtasks: {
                select: {
                  assignedDeveloper: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                  createdAt: true,
                  description: true,
                  displayId: true,
                  id: true,
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
                  status: true,
                  title: true,
                  updatedAt: true,
                },
              },
            },
          },
        },
        where: {
          id: taskUuid,
        },
      });
    });

    it('unassigns a task and clears skills', async () => {
      // displayId: 15, dev-1, skill-1
      const taskUuid = '11111111-1111-1111-1111-000000000015';
      const skillUuid = '33333333-3333-3333-3333-000000000001';
      const { updateTaskById } = await loadTasksService({
        taskFindUniqueImplementation: async () => ({
          assignedDeveloperId: '22222222-2222-2222-2222-000000000001',
          id: taskUuid,
          skills: [
            {
              skillId: skillUuid,
            },
          ],
        }),
        taskUpdateImplementation: async () => ({
          assignedDeveloper: null,
          createdAt: new Date('2026-03-18T00:00:00.000Z'),
          description: null,
          displayId: 15,
          id: taskUuid,
          parentTask: null,
          skills: [],
          status: TaskStatus.TODO,
          subtasks: [],
          title: 'Build API',
          updatedAt: new Date('2026-03-18T01:00:00.000Z'),
        }),
      });

      await expect(
        updateTaskById(taskUuid, {
          assignedDeveloperId: null,
          skillIds: [],
        }),
      ).resolves.toMatchObject({
        assignedDeveloper: null,
        skills: [],
      });
    });

    it('rejects a task update when the assigned developer lacks a required skill', async () => {
      // displayId: 16, dev-1, skill-1
      const taskUuid = '11111111-1111-1111-1111-000000000016';
      const devUuid = '22222222-2222-2222-2222-000000000001';
      const skillUuid = '33333333-3333-3333-3333-000000000001';
      const { updateTaskById } = await loadTasksService({
        developerFindUniqueImplementation: async () => ({
          id: devUuid,
          skills: [],
        }),
        skillFindManyImplementation: async () => [
          {
            id: skillUuid,
          },
        ],
        taskFindUniqueImplementation: async () => ({
          assignedDeveloperId: null,
          id: taskUuid,
          parentTask: null,
          parentTaskId: null,
          skills: [],
          status: TaskStatus.TODO,
          subtasks: [],
        }),
      });

      await expect(
        updateTaskById(taskUuid, {
          assignedDeveloperId: devUuid,
          skillIds: [skillUuid],
        }),
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Assigned developer does not have all required skills',
        status: StatusCodes.BAD_REQUEST,
      });
    });
  });
});
