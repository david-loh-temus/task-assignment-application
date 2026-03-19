import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { TaskStatus } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { loadTasksService } from '../../../__test__/__helpers__/database-test-helper';

describe('tasks.service - Subtasks Hierarchy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('subtask creation', () => {
    it('creates a sub-task with a valid parent task', async () => {
      // displayId: 10 (parent), displayId: 20 (subtask)
      const parentUuid = '11111111-1111-1111-1111-000000000010';
      const subtaskUuid = '11111111-1111-1111-1111-000000000020';
      const { createTask, databaseDouble } = await loadTasksService({
        classifyTaskSkillsImplementation: async () => ['backend'],
        getSkillNamesForAiImplementation: async () => ['backend', 'frontend'],
        skillFindManyImplementation: async () => [
          {
            id: 'skill-backend',
            name: 'backend',
          },
        ],
        taskFindUniqueImplementation: async () => ({
          id: parentUuid,
          parentTaskId: null,
        }),
        taskCreateImplementation: async () => ({
          assignedDeveloper: null,
          createdAt: new Date('2026-03-18T00:00:00.000Z'),
          description: null,
          displayId: 20,
          id: subtaskUuid,
          parentTask: {
            displayId: 10,
            id: parentUuid,
            title: 'Parent Task',
          },
          skills: [],
          status: TaskStatus.TODO,
          subtasks: [],
          title: 'Sub Task',
          updatedAt: new Date('2026-03-18T01:00:00.000Z'),
        }),
      });

      await expect(
        createTask({
          parentTaskId: parentUuid,
          title: 'Sub Task',
        }),
      ).resolves.toMatchObject({
        displayId: 20,
        id: subtaskUuid,
        parentTask: {
          id: parentUuid,
          title: 'Parent Task',
        },
        title: 'Sub Task',
      });
      expect(databaseDouble.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            parentTaskId: parentUuid,
            title: 'Sub Task',
          }),
        }),
      );
    });

    it('rejects sub-task creation when parent task does not exist', async () => {
      const { createTask } = await loadTasksService({
        taskFindUniqueImplementation: async () => null,
      });

      const nonExistentParentUuid = '11111111-1111-1111-1111-999999999999';
      await expect(
        createTask({
          parentTaskId: nonExistentParentUuid,
          title: 'Sub Task',
        }),
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Parent task not found',
        status: StatusCodes.NOT_FOUND,
      });
    });

    it('rejects sub-task creation when nesting depth would exceed 3 levels', async () => {
      // displayId: 30 (level 0), 31 (level 1), 32 (level 2)
      const taskUuid0 = '11111111-1111-1111-1111-000000000030';
      const taskUuid1 = '11111111-1111-1111-1111-000000000031';
      const taskUuid2 = '11111111-1111-1111-1111-000000000032';
      const { createTask } = await loadTasksService({
        taskFindUniqueImplementation: (async (args: { where: { id: string } }) => {
          // Simulate a chain: task-0 <- task-1 <- task-2
          // Trying to add another level would exceed max depth of 3
          if (args.where.id === taskUuid2) {
            return { id: taskUuid2, parentTaskId: taskUuid1 };
          }
          if (args.where.id === taskUuid1) {
            return { id: taskUuid1, parentTaskId: taskUuid0 };
          }
          if (args.where.id === taskUuid0) {
            return { id: taskUuid0, parentTaskId: null };
          }
          return null;
        }) as unknown as (args: unknown) => Promise<unknown>,
      });

      await expect(
        createTask({
          parentTaskId: taskUuid2,
          title: 'Sub-Sub-Sub Task',
        }),
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Task nesting depth cannot exceed 3 levels (task → sub-task → sub-sub-task)',
        status: StatusCodes.BAD_REQUEST,
      });
    });

    it('allows creating a sub-sub-task with 2 levels of nesting', async () => {
      // displayId: 40 (parent), 41 (subtask), 42 (sub-subtask)
      const parentUuid = '11111111-1111-1111-1111-000000000040';
      const subtaskUuid = '11111111-1111-1111-1111-000000000041';
      const parentTask = { id: parentUuid, parentTaskId: null };
      const currentTask = { id: subtaskUuid, parentTaskId: parentUuid };

      let callCount = 0;
      const { createTask, databaseDouble } = await loadTasksService({
        classifyTaskSkillsImplementation: async () => ['backend'],
        getSkillNamesForAiImplementation: async () => ['backend', 'frontend'],
        skillFindManyImplementation: async () => [
          {
            id: 'skill-backend',
            name: 'backend',
          },
        ],
        taskFindUniqueImplementation: async () => {
          callCount += 1;
          if (callCount === 1) return currentTask;
          if (callCount === 2) return parentTask;
          return null;
        },
        taskCreateImplementation: async () => ({
          assignedDeveloper: null,
          createdAt: new Date('2026-03-18T00:00:00.000Z'),
          description: null,
          displayId: 42,
          id: '11111111-1111-1111-1111-000000000042',
          parentTask: {
            displayId: 41,
            id: subtaskUuid,
            title: 'Sub Task',
          },
          skills: [],
          status: TaskStatus.TODO,
          subtasks: [],
          title: 'Sub-Sub Task',
          updatedAt: new Date('2026-03-18T01:00:00.000Z'),
        }),
      });

      await expect(
        createTask({
          parentTaskId: subtaskUuid,
          title: 'Sub-Sub Task',
        }),
      ).resolves.toMatchObject({
        displayId: 42,
        id: '11111111-1111-1111-1111-000000000042',
        title: 'Sub-Sub Task',
      });
      expect(databaseDouble.task.create).toHaveBeenCalled();
    });
  });

  describe('circular reference prevention', () => {
    it('rejects circular reference when task is its own parent', async () => {
      // displayId: 50
      const taskUuid = '11111111-1111-1111-1111-000000000050';
      const { updateTaskById } = await loadTasksService({
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
          parentTaskId: taskUuid,
        }),
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'A task cannot be its own parent',
        status: StatusCodes.BAD_REQUEST,
      });
    });

    it('rejects circular reference when moving task would create a cycle', async () => {
      // displayId: 60 (parent), 61 (child)
      const parentUuid = '11111111-1111-1111-1111-000000000060';
      const childUuid = '11111111-1111-1111-1111-000000000061';
      const { updateTaskById } = await loadTasksService({
        taskFindUniqueImplementation: (async (args: { where: { id: string } }) => {
          if (args.where.id === parentUuid) {
            return {
              assignedDeveloperId: null,
              id: parentUuid,
              parentTask: null,
              parentTaskId: null,
              skills: [],
              status: TaskStatus.TODO,
              subtasks: [],
            };
          }
          // child is a parent that would lead to a cycle
          if (args.where.id === childUuid) {
            return {
              id: childUuid,
              parentTaskId: parentUuid, // child's parent is parent, creating a cycle if we set parent's parent to child
            };
          }
          return null;
        }) as unknown as (args: unknown) => Promise<unknown>,
      });

      // parent is parent of child, trying to make parent child of child would create cycle
      await expect(
        updateTaskById(parentUuid, {
          parentTaskId: childUuid,
        }),
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Moving this task would create a circular reference',
        status: StatusCodes.BAD_REQUEST,
      });
    });
  });

  describe('parent task completion rules', () => {
    it('rejects marking parent task as DONE when subtasks are incomplete', async () => {
      // displayId: 70 (parent), 71 (child)
      const parentUuid = '11111111-1111-1111-1111-000000000070';
      const childUuid = '11111111-1111-1111-1111-000000000071';
      const { updateTaskById, databaseDouble } = await loadTasksService({
        taskFindUniqueImplementation: async () => ({
          assignedDeveloperId: null,
          id: parentUuid,
          parentTask: null,
          parentTaskId: null,
          skills: [],
          status: TaskStatus.TODO,
          subtasks: [
            {
              id: childUuid,
              status: TaskStatus.TODO,
            },
          ],
        }),
        taskUpdateImplementation: async () => ({
          assignedDeveloper: null,
          createdAt: new Date('2026-03-18T00:00:00.000Z'),
          description: null,
          displayId: 70,
          id: parentUuid,
          parentTask: null,
          skills: [],
          status: TaskStatus.DONE,
          subtasks: [],
          title: 'Parent Task',
          updatedAt: new Date('2026-03-18T01:00:00.000Z'),
        }),
      });

      databaseDouble.$queryRaw = jest.fn(async () => [
        {
          id: childUuid,
          status: TaskStatus.TODO,
        },
      ]);

      await expect(
        updateTaskById(parentUuid, {
          status: TaskStatus.DONE,
        }),
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Cannot mark task as DONE. 1 subtask(s) are not yet complete.',
        status: StatusCodes.BAD_REQUEST,
      });
    });

    it('allows marking parent task as DONE when all subtasks are DONE', async () => {
      // displayId: 80 (parent), 81 (child)
      const parentUuid = '11111111-1111-1111-1111-000000000080';
      const childUuid = '11111111-1111-1111-1111-000000000081';
      const { updateTaskById, databaseDouble } = await loadTasksService({
        taskFindUniqueImplementation: async () => ({
          assignedDeveloperId: null,
          id: parentUuid,
          parentTask: null,
          parentTaskId: null,
          skills: [],
          status: TaskStatus.IN_PROGRESS,
          subtasks: [
            {
              id: childUuid,
              status: TaskStatus.DONE,
            },
          ],
        }),
        taskUpdateImplementation: async () => ({
          assignedDeveloper: null,
          createdAt: new Date('2026-03-18T00:00:00.000Z'),
          description: null,
          displayId: 80,
          id: parentUuid,
          parentTask: null,
          skills: [],
          status: TaskStatus.DONE,
          subtasks: [
            {
              assignedDeveloper: null,
              createdAt: new Date('2026-03-18T00:00:00.000Z'),
              description: null,
              displayId: 81,
              id: childUuid,
              parentTask: {
                displayId: 80,
                id: parentUuid,
                title: 'Parent Task',
              },
              skills: [],
              status: TaskStatus.DONE,
              subtasks: [],
              title: 'Child Task',
              updatedAt: new Date('2026-03-18T00:00:00.000Z'),
            },
          ],
          title: 'Parent Task',
          updatedAt: new Date('2026-03-18T01:00:00.000Z'),
        }),
      });

      databaseDouble.$queryRaw = jest.fn(async () => []);

      await expect(
        updateTaskById(parentUuid, {
          status: TaskStatus.DONE,
        }),
      ).resolves.toMatchObject({
        displayId: 80,
        id: parentUuid,
        status: TaskStatus.DONE,
      });
    });
  });

  describe('nested subtasks retrieval', () => {
    it('returns task with nested subtasks hierarchy', async () => {
      // displayId: 90 (parent), 91 (child)
      const parentUuid = '11111111-1111-1111-1111-000000000090';
      const childUuid = '11111111-1111-1111-1111-000000000091';
      const { getTasks } = await loadTasksService({
        taskFindManyImplementation: async () => [
          {
            assignedDeveloper: null,
            createdAt: new Date('2026-03-18T00:00:00.000Z'),
            description: null,
            displayId: 90,
            id: parentUuid,
            parentTask: null,
            skills: [],
            status: TaskStatus.TODO,
            subtasks: [
              {
                createdAt: new Date('2026-03-18T00:00:00.000Z'),
                description: null,
                displayId: 91,
                id: childUuid,
                status: TaskStatus.TODO,
                title: 'Child Task',
                updatedAt: new Date('2026-03-18T00:00:00.000Z'),
              },
            ],
            title: 'Parent Task',
            updatedAt: new Date('2026-03-18T01:00:00.000Z'),
          },
        ],
      });

      const result = await getTasks();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        displayId: 90,
        id: parentUuid,
        title: 'Parent Task',
        parentTask: null,
        subtasks: expect.arrayContaining([
          expect.objectContaining({
            displayId: 91,
            id: childUuid,
            title: 'Child Task',
          }),
        ]),
      });
    });
  });
});
