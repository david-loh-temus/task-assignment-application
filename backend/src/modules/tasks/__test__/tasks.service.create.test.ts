import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { TaskStatus } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { loadTasksService } from '../../../__test__/__helpers__/database-test-helper';
import { expectedTaskReadInclude } from './__fixtures__/task-fixtures';

describe('tasks.service - Create Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    it('creates a task with no relations', async () => {
      const { createTask, databaseDouble } = await loadTasksService({
        skillFindManyImplementation: async () => [],
        taskCreateImplementation: async () => ({
          assignedDeveloper: null,
          createdAt: new Date('2026-03-18T00:00:00.000Z'),
          description: null,
          displayId: 12,
          id: '11111111-1111-1111-1111-000000000012',
          parentTask: null,
          skills: [],
          status: TaskStatus.TODO,
          subtasks: [],
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
        id: '11111111-1111-1111-1111-000000000012',
        parentTask: null,
        skills: [],
        status: TaskStatus.TODO,
        subtasks: [],
        title: 'Build API',
        updatedAt: '2026-03-18T01:00:00.000Z',
      });
      expect(databaseDouble.task.create).toHaveBeenCalledWith({
        data: {
          title: 'Build API',
        },
        ...expectedTaskReadInclude,
      });
    });

    it('creates a task with skills and an assigned developer when they are compatible', async () => {
      // displayId: 13, dev-1, skill-1
      const devUuid = '22222222-2222-2222-2222-000000000001';
      const skillUuid = '33333333-3333-3333-3333-000000000001';
      const { createTask, databaseDouble } = await loadTasksService({
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
        taskCreateImplementation: async () => ({
          assignedDeveloper: {
            id: devUuid,
            name: 'Alice',
          },
          createdAt: new Date('2026-03-18T00:00:00.000Z'),
          description: 'Implement the task module',
          displayId: 13,
          id: '11111111-1111-1111-1111-000000000013',
          parentTask: null,
          skills: [
            {
              skill: {
                id: skillUuid,
                name: 'Backend',
              },
            },
          ],
          status: TaskStatus.TODO,
          subtasks: [],
          title: 'Build API',
          updatedAt: new Date('2026-03-18T01:00:00.000Z'),
        }),
      });

      await expect(
        createTask({
          assignedDeveloperId: devUuid,
          description: 'Implement the task module',
          skillIds: [skillUuid],
          title: 'Build API',
        }),
      ).resolves.toMatchObject({
        assignedDeveloper: {
          id: devUuid,
          name: 'Alice',
        },
        description: 'Implement the task module',
        displayId: 13,
        id: '11111111-1111-1111-1111-000000000013',
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
          id: devUuid,
        },
      });
      expect(databaseDouble.skill.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
        },
        where: {
          id: {
            in: [skillUuid],
          },
        },
      });
      expect(databaseDouble.task.create).toHaveBeenCalledWith({
        data: {
          assignedDeveloperId: devUuid,
          description: 'Implement the task module',
          skills: {
            create: [
              {
                skillId: skillUuid,
              },
            ],
          },
          title: 'Build API',
        },
        ...expectedTaskReadInclude,
      });
    });

    it('rejects task creation when the assigned developer does not exist', async () => {
      const { createTask } = await loadTasksService({
        developerFindUniqueImplementation: async () => null,
      });

      const nonExistentDevUuid = '22222222-2222-2222-2222-999999999999';
      await expect(
        createTask({
          assignedDeveloperId: nonExistentDevUuid,
          title: 'Build API',
        }),
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Developer not found',
        status: StatusCodes.NOT_FOUND,
      });
    });

    it('rejects task creation when a required skill does not exist', async () => {
      const skillUuid1 = '33333333-3333-3333-3333-000000000001';
      const skillUuid2 = '33333333-3333-3333-3333-000000000002';
      const { createTask } = await loadTasksService({
        skillFindManyImplementation: async () => [
          {
            id: skillUuid1,
          },
        ],
      });

      await expect(
        createTask({
          skillIds: [skillUuid1, skillUuid2],
          title: 'Build API',
        }),
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'One or more skills were not found',
        status: StatusCodes.NOT_FOUND,
      });
    });

    it('rejects task creation when the assigned developer lacks a required skill', async () => {
      const devUuid = '22222222-2222-2222-2222-000000000001';
      const skillUuid = '33333333-3333-3333-3333-000000000001';
      const { createTask } = await loadTasksService({
        developerFindUniqueImplementation: async () => ({
          id: devUuid,
          skills: [],
        }),
        skillFindManyImplementation: async () => [
          {
            id: skillUuid,
          },
        ],
      });

      await expect(
        createTask({
          assignedDeveloperId: devUuid,
          skillIds: [skillUuid],
          title: 'Build API',
        }),
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Assigned developer does not have all required skills',
        status: StatusCodes.BAD_REQUEST,
      });
    });
  });
});
