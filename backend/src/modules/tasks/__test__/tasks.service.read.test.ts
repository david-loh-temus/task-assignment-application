import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { TaskStatus } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { loadTasksService } from '../../../__test__/__helpers__/database-test-helper';
import {
  expectedTaskReadInclude,
  sampleDeveloper,
  sampleSkill,
  sampleTaskWithDeveloperAndSkills,
} from './__fixtures__/task-fixtures';

describe('tasks.service - Read Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTasks', () => {
    it('returns tasks with inline developer and skills', async () => {
      const { databaseDouble, getTasks } = await loadTasksService({
        taskFindManyImplementation: async () => [sampleTaskWithDeveloperAndSkills],
      });

      await expect(getTasks()).resolves.toEqual([
        {
          assignedDeveloper: sampleDeveloper,
          createdAt: '2026-03-18T00:00:00.000Z',
          description: 'Implement the task module',
          displayId: 10,
          id: '11111111-1111-1111-1111-000000000010',
          parentTask: null,
          skills: [sampleSkill],
          status: TaskStatus.TODO,
          subtasks: [],
          title: 'Build API',
          updatedAt: '2026-03-18T01:00:00.000Z',
        },
      ]);
      expect(databaseDouble.task.findMany).toHaveBeenCalledWith({
        ...expectedTaskReadInclude,
        orderBy: {
          displayId: 'asc',
        },
      });
    });
  });

  describe('getTaskById', () => {
    it('returns a single task when present', async () => {
      // displayId: 11
      const taskUuid = '11111111-1111-1111-1111-000000000011';
      const { databaseDouble, getTaskById } = await loadTasksService({
        taskFindUniqueImplementation: async () => ({
          assignedDeveloper: null,
          createdAt: new Date('2026-03-18T00:00:00.000Z'),
          description: null,
          displayId: 11,
          id: taskUuid,
          parentTask: null,
          skills: [],
          status: TaskStatus.IN_PROGRESS,
          subtasks: [],
          title: 'Build API',
          updatedAt: new Date('2026-03-18T01:00:00.000Z'),
        }),
      });

      await expect(getTaskById(taskUuid)).resolves.toEqual({
        assignedDeveloper: null,
        createdAt: '2026-03-18T00:00:00.000Z',
        description: null,
        displayId: 11,
        id: taskUuid,
        parentTask: null,
        skills: [],
        status: TaskStatus.IN_PROGRESS,
        subtasks: [],
        title: 'Build API',
        updatedAt: '2026-03-18T01:00:00.000Z',
      });
      expect(databaseDouble.task.findUnique).toHaveBeenCalledWith({
        ...expectedTaskReadInclude,
        where: {
          id: taskUuid,
        },
      });
    });

    it('throws a not found error when the task does not exist', async () => {
      const { getTaskById } = await loadTasksService({
        taskFindUniqueImplementation: async () => null,
      });

      const nonExistentUuid = '11111111-1111-1111-1111-999999999999';
      await expect(getTaskById(nonExistentUuid)).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Task not found',
        status: StatusCodes.NOT_FOUND,
      });
    });
  });
});
