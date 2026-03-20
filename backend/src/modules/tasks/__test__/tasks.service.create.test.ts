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
    it('generates required skills with Gemini when skillIds are omitted', async () => {
      const backendSkillId = '33333333-3333-3333-3333-000000000001';
      const { createTask, databaseDouble } = await loadTasksService({
        classifyTaskSkillsImplementation: async () => ['Backend'],
        getSkillNamesForAiImplementation: async () => ['Backend', 'Frontend'],
        skillFindManyImplementation: async () => [
          {
            id: backendSkillId,
            name: 'backend',
          },
        ],
        skillUpsertImplementation: async () => ({
          id: backendSkillId,
          name: 'backend',
          source: 'HUMAN',
        }),
        taskCreateImplementation: async () => ({
          assignedDeveloper: null,
          createdAt: new Date('2026-03-18T00:00:00.000Z'),
          description: null,
          displayId: 12,
          id: '11111111-1111-1111-1111-000000000012',
          parentTask: null,
          skills: [
            {
              skill: {
                id: backendSkillId,
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
          title: 'Build API',
        }),
      ).resolves.toEqual({
        assignedDeveloper: null,
        createdAt: '2026-03-18T00:00:00.000Z',
        description: null,
        displayId: 12,
        id: '11111111-1111-1111-1111-000000000012',
        parentTask: null,
        skills: [
          {
            id: backendSkillId,
            name: 'Backend',
          },
        ],
        status: TaskStatus.TODO,
        subtasks: [],
        title: 'Build API',
        updatedAt: '2026-03-18T01:00:00.000Z',
      });
      expect(databaseDouble.$transaction).toHaveBeenCalledTimes(1);
      expect(databaseDouble.skill.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
        },
        where: {
          name: {
            in: ['backend'],
          },
        },
      });
      expect(databaseDouble.skill.upsert).not.toHaveBeenCalled();
      expect(databaseDouble.task.create).toHaveBeenCalledWith({
        data: {
          skills: {
            create: [
              {
                skillId: backendSkillId,
              },
            ],
          },
          title: 'Build API',
        },
        ...expectedTaskReadInclude,
      });
    });

    it('creates a task with provided skills and skips Gemini classification', async () => {
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
      expect(databaseDouble.$transaction).not.toHaveBeenCalled();
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

    it('creates new LLM skills when Gemini returns names that do not exist', async () => {
      const llmSkillId = '33333333-3333-3333-3333-000000000099';
      const { createTask, databaseDouble } = await loadTasksService({
        classifyTaskSkillsImplementation: async () => ['api_design'],
        getSkillNamesForAiImplementation: async () => ['Backend', 'Frontend'],
        skillFindManyImplementation: async () => [],
        skillUpsertImplementation: async () => ({
          id: llmSkillId,
          name: 'api_design',
          source: 'LLM',
        }),
        taskCreateImplementation: async () => ({
          assignedDeveloper: null,
          createdAt: new Date('2026-03-18T00:00:00.000Z'),
          description: null,
          displayId: 14,
          id: '11111111-1111-1111-1111-000000000014',
          parentTask: null,
          skills: [
            {
              skill: {
                id: llmSkillId,
                name: 'api_design',
              },
            },
          ],
          status: TaskStatus.TODO,
          subtasks: [],
          title: 'Design the API',
          updatedAt: new Date('2026-03-18T01:00:00.000Z'),
        }),
      });

      await expect(
        createTask({
          title: 'Design the API',
        }),
      ).resolves.toMatchObject({
        displayId: 14,
        skills: [
          {
            id: llmSkillId,
            name: 'api_design',
          },
        ],
      });
      expect(databaseDouble.skill.upsert).toHaveBeenCalledWith({
        create: {
          name: 'api_design',
          source: 'LLM',
        },
        update: {},
        where: {
          name: 'api_design',
        },
      });
    });

    it('rejects task creation when Gemini-generated skills do not match the assigned developer', async () => {
      const devUuid = '22222222-2222-2222-2222-000000000001';
      const backendSkillId = '33333333-3333-3333-3333-000000000001';
      const { createTask, databaseDouble } = await loadTasksService({
        classifyTaskSkillsImplementation: async () => ['Backend', 'api_design'],
        developerFindUniqueImplementation: async () => ({
          id: devUuid,
          skills: [
            {
              skillId: backendSkillId,
            },
          ],
        }),
        getSkillNamesForAiImplementation: async () => ['Backend'],
        skillFindManyImplementation: async () => [
          {
            id: backendSkillId,
            name: 'Backend',
          },
        ],
        skillUpsertImplementation: async () => ({
          id: '33333333-3333-3333-3333-000000000002',
          name: 'api_design',
          source: 'LLM',
        }),
      });

      await expect(
        createTask({
          assignedDeveloperId: devUuid,
          title: 'Design the API',
        }),
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Assigned developer does not have all required skills',
        status: StatusCodes.BAD_REQUEST,
      });
      expect(databaseDouble.task.create).not.toHaveBeenCalled();
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

    it('rejects task creation when a required provided skill does not exist', async () => {
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

    it('rejects task creation when Gemini returns no skills', async () => {
      const { createTask } = await loadTasksService({
        classifyTaskSkillsImplementation: async () => [],
        getSkillNamesForAiImplementation: async () => ['Backend', 'Frontend'],
      });

      await expect(
        createTask({
          title: 'Build API',
        }),
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Gemini did not return any required skills',
        status: StatusCodes.BAD_REQUEST,
      });
    });
  });

  describe('createTask - Field Combinations Coverage', () => {
    it('creates a task with only title (no optional fields)', async () => {
      const backendSkillId = '33333333-3333-3333-3333-000000000001';
      const { createTask, databaseDouble } = await loadTasksService({
        classifyTaskSkillsImplementation: async () => ['Backend'],
        getSkillNamesForAiImplementation: async () => ['Backend', 'Frontend'],
        skillFindManyImplementation: async () => [
          {
            id: backendSkillId,
            name: 'backend',
          },
        ],
        taskCreateImplementation: async () => ({
          assignedDeveloper: null,
          createdAt: new Date('2026-03-18T00:00:00.000Z'),
          description: null,
          displayId: 100,
          id: '11111111-1111-1111-1111-000000000100',
          parentTask: null,
          skills: [
            {
              skill: {
                id: backendSkillId,
                name: 'Backend',
              },
            },
          ],
          status: TaskStatus.TODO,
          subtasks: [],
          title: 'Minimal Task',
          updatedAt: new Date('2026-03-18T01:00:00.000Z'),
        }),
      });

      await expect(
        createTask({
          title: 'Minimal Task',
        }),
      ).resolves.toMatchObject({
        displayId: 100,
        assignedDeveloper: null,
        description: null,
        parentTask: null,
        status: TaskStatus.TODO,
        title: 'Minimal Task',
      });

      expect(databaseDouble.task.create).toHaveBeenCalledWith({
        data: {
          skills: {
            create: [
              {
                skillId: backendSkillId,
              },
            ],
          },
          title: 'Minimal Task',
        },
        ...expectedTaskReadInclude,
      });
    });

    it('creates a task with only title and description', async () => {
      const backendSkillId = '33333333-3333-3333-3333-000000000001';
      const { createTask, databaseDouble } = await loadTasksService({
        classifyTaskSkillsImplementation: async () => ['Backend'],
        getSkillNamesForAiImplementation: async () => ['Backend', 'Frontend'],
        skillFindManyImplementation: async () => [
          {
            id: backendSkillId,
            name: 'backend',
          },
        ],
        taskCreateImplementation: async () => ({
          assignedDeveloper: null,
          createdAt: new Date('2026-03-18T00:00:00.000Z'),
          description: 'Task description',
          displayId: 101,
          id: '11111111-1111-1111-1111-000000000101',
          parentTask: null,
          skills: [
            {
              skill: {
                id: backendSkillId,
                name: 'Backend',
              },
            },
          ],
          status: TaskStatus.TODO,
          subtasks: [],
          title: 'Task with Description',
          updatedAt: new Date('2026-03-18T01:00:00.000Z'),
        }),
      });

      await expect(
        createTask({
          title: 'Task with Description',
          description: 'Task description',
        }),
      ).resolves.toMatchObject({
        displayId: 101,
        description: 'Task description',
        status: TaskStatus.TODO,
      });

      expect(databaseDouble.task.create).toHaveBeenCalledWith({
        data: {
          description: 'Task description',
          skills: {
            create: [
              {
                skillId: backendSkillId,
              },
            ],
          },
          title: 'Task with Description',
        },
        ...expectedTaskReadInclude,
      });
    });

    it('creates a task with title and status (no other optional fields)', async () => {
      const backendSkillId = '33333333-3333-3333-3333-000000000001';
      const { createTask, databaseDouble } = await loadTasksService({
        classifyTaskSkillsImplementation: async () => ['Backend'],
        getSkillNamesForAiImplementation: async () => ['Backend', 'Frontend'],
        skillFindManyImplementation: async () => [
          {
            id: backendSkillId,
            name: 'backend',
          },
        ],
        taskCreateImplementation: async () => ({
          assignedDeveloper: null,
          createdAt: new Date('2026-03-18T00:00:00.000Z'),
          description: null,
          displayId: 102,
          id: '11111111-1111-1111-1111-000000000102',
          parentTask: null,
          skills: [
            {
              skill: {
                id: backendSkillId,
                name: 'Backend',
              },
            },
          ],
          status: TaskStatus.IN_PROGRESS,
          subtasks: [],
          title: 'Task with Status',
          updatedAt: new Date('2026-03-18T01:00:00.000Z'),
        }),
      });

      await expect(
        createTask({
          title: 'Task with Status',
          status: TaskStatus.IN_PROGRESS,
        }),
      ).resolves.toMatchObject({
        displayId: 102,
        status: TaskStatus.IN_PROGRESS,
        title: 'Task with Status',
      });

      expect(databaseDouble.task.create).toHaveBeenCalledWith({
        data: {
          status: TaskStatus.IN_PROGRESS,
          skills: {
            create: [
              {
                skillId: backendSkillId,
              },
            ],
          },
          title: 'Task with Status',
        },
        ...expectedTaskReadInclude,
      });
    });

    it('creates a task with title, status, and assignedDeveloper (no skills/parent/description)', async () => {
      const devUuid = '22222222-2222-2222-2222-000000000002';
      const backendSkillId = '33333333-3333-3333-3333-000000000001';
      const { createTask, databaseDouble } = await loadTasksService({
        developerFindUniqueImplementation: async () => ({
          id: devUuid,
          skills: [
            {
              skillId: backendSkillId,
            },
          ],
        }),
        classifyTaskSkillsImplementation: async () => ['Backend'],
        getSkillNamesForAiImplementation: async () => ['Backend', 'Frontend'],
        skillFindManyImplementation: async () => [
          {
            id: backendSkillId,
            name: 'backend',
          },
        ],
        taskCreateImplementation: async () => ({
          assignedDeveloper: {
            id: devUuid,
            name: 'Bob',
          },
          createdAt: new Date('2026-03-18T00:00:00.000Z'),
          description: null,
          displayId: 103,
          id: '11111111-1111-1111-1111-000000000103',
          parentTask: null,
          skills: [
            {
              skill: {
                id: backendSkillId,
                name: 'Backend',
              },
            },
          ],
          status: TaskStatus.IN_PROGRESS,
          subtasks: [],
          title: 'Task Assigned to Dev',
          updatedAt: new Date('2026-03-18T01:00:00.000Z'),
        }),
      });

      await expect(
        createTask({
          title: 'Task Assigned to Dev',
          status: TaskStatus.IN_PROGRESS,
          assignedDeveloperId: devUuid,
        }),
      ).resolves.toMatchObject({
        displayId: 103,
        assignedDeveloper: {
          id: devUuid,
          name: 'Bob',
        },
        status: TaskStatus.IN_PROGRESS,
      });

      expect(databaseDouble.task.create).toHaveBeenCalledWith({
        data: {
          assignedDeveloperId: devUuid,
          status: TaskStatus.IN_PROGRESS,
          skills: {
            create: [
              {
                skillId: backendSkillId,
              },
            ],
          },
          title: 'Task Assigned to Dev',
        },
        ...expectedTaskReadInclude,
      });
    });

    it('creates a task with title and parent (no status/skills/assignedDeveloper/description)', async () => {
      const parentUuid = '11111111-1111-1111-1111-000000000050';
      const backendSkillId = '33333333-3333-3333-3333-000000000001';
      const { createTask, databaseDouble } = await loadTasksService({
        taskFindUniqueImplementation: async () => ({
          id: parentUuid,
          parentTaskId: null,
        }),
        classifyTaskSkillsImplementation: async () => ['Backend'],
        getSkillNamesForAiImplementation: async () => ['Backend', 'Frontend'],
        skillFindManyImplementation: async () => [
          {
            id: backendSkillId,
            name: 'backend',
          },
        ],
        taskCreateImplementation: async () => ({
          assignedDeveloper: null,
          createdAt: new Date('2026-03-18T00:00:00.000Z'),
          description: null,
          displayId: 104,
          id: '11111111-1111-1111-1111-000000000104',
          parentTask: {
            displayId: 1,
            id: parentUuid,
            title: 'Parent Task',
          },
          skills: [
            {
              skill: {
                id: backendSkillId,
                name: 'Backend',
              },
            },
          ],
          status: TaskStatus.TODO,
          subtasks: [],
          title: 'Subtask without Status',
          updatedAt: new Date('2026-03-18T01:00:00.000Z'),
        }),
      });

      await expect(
        createTask({
          title: 'Subtask without Status',
          parentTaskId: parentUuid,
        }),
      ).resolves.toMatchObject({
        displayId: 104,
        parentTask: {
          id: parentUuid,
        },
        status: TaskStatus.TODO,
      });

      expect(databaseDouble.task.create).toHaveBeenCalledWith({
        data: {
          parentTaskId: parentUuid,
          skills: {
            create: [
              {
                skillId: backendSkillId,
              },
            ],
          },
          title: 'Subtask without Status',
        },
        ...expectedTaskReadInclude,
      });
    });

    it('creates a task with all fields: title, status, assignedDeveloper, skillIds, parentTaskId, description', async () => {
      const devUuid = '22222222-2222-2222-2222-000000000003';
      const skillUuid = '33333333-3333-3333-3333-000000000003';
      const parentUuid = '11111111-1111-1111-1111-000000000051';

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
            name: 'Frontend',
          },
        ],
        taskFindUniqueImplementation: async () => ({
          id: parentUuid,
          parentTaskId: null,
        }),
        taskCreateImplementation: async () => ({
          assignedDeveloper: {
            id: devUuid,
            name: 'Charlie',
          },
          createdAt: new Date('2026-03-20T07:37:54.905Z'),
          description: 'Complete implementation',
          displayId: 105,
          id: '11111111-1111-1111-1111-000000000105',
          parentTask: {
            displayId: 1,
            id: parentUuid,
            title: 'Parent Task Title',
          },
          skills: [
            {
              skill: {
                id: skillUuid,
                name: 'Frontend',
              },
            },
          ],
          status: TaskStatus.IN_PROGRESS,
          subtasks: [],
          title: 'Full Featured Subtask',
          updatedAt: new Date('2026-03-20T07:37:54.905Z'),
        }),
      });

      await expect(
        createTask({
          title: 'Full Featured Subtask',
          description: 'Complete implementation',
          assignedDeveloperId: devUuid,
          skillIds: [skillUuid],
          status: TaskStatus.IN_PROGRESS,
          parentTaskId: parentUuid,
        }),
      ).resolves.toMatchObject({
        displayId: 105,
        title: 'Full Featured Subtask',
        description: 'Complete implementation',
        assignedDeveloper: {
          id: devUuid,
          name: 'Charlie',
        },
        skills: [
          {
            id: skillUuid,
            name: 'Frontend',
          },
        ],
        status: TaskStatus.IN_PROGRESS,
        parentTask: {
          id: parentUuid,
        },
      });

      expect(databaseDouble.task.create).toHaveBeenCalledWith({
        data: {
          assignedDeveloperId: devUuid,
          description: 'Complete implementation',
          parentTaskId: parentUuid,
          status: TaskStatus.IN_PROGRESS,
          skills: {
            create: [
              {
                skillId: skillUuid,
              },
            ],
          },
          title: 'Full Featured Subtask',
        },
        ...expectedTaskReadInclude,
      });
    });

    it('creates subtask with all fields including null description - exact user scenario', async () => {
      // Exact payload from user issue: ALL fields including status, assignedDeveloper, skillIds, parentTaskId
      const devUuid = '0f1919ca-c313-4880-b225-0039256dc47d';
      const skillUuid = '29f35936-dbdc-4c7e-ad79-52aacb8a5911';
      const parentUuid = '1c4ae6f7-3010-41d0-b5e0-901891f6bbb5';

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
            name: 'Frontend',
          },
        ],
        taskFindUniqueImplementation: async () => ({
          id: parentUuid,
          parentTaskId: null,
        }),
        taskCreateImplementation: async () => ({
          assignedDeveloper: {
            id: devUuid,
            name: 'Alice',
          },
          createdAt: new Date('2026-03-20T07:49:48.365Z'),
          description: null,
          displayId: 7,
          id: '1b5cc42f-da89-4436-9115-3b8ff255f602',
          parentTask: {
            displayId: 1,
            id: parentUuid,
            title: 'Parent Task',
          },
          skills: [
            {
              skill: {
                id: skillUuid,
                name: 'Frontend',
              },
            },
          ],
          status: TaskStatus.IN_PROGRESS,
          subtasks: [],
          title: 'Add Subtask for #1 V4',
          updatedAt: new Date('2026-03-20T07:49:48.365Z'),
        }),
      });

      await expect(
        createTask({
          title: 'Add Subtask for #1 V4',
          description: null,
          assignedDeveloperId: devUuid,
          skillIds: [skillUuid],
          status: TaskStatus.IN_PROGRESS,
          parentTaskId: parentUuid,
        }),
      ).resolves.toMatchObject({
        displayId: 7,
        title: 'Add Subtask for #1 V4',
        description: null,
        assignedDeveloper: {
          id: devUuid,
          name: 'Alice',
        },
        skills: [
          {
            id: skillUuid,
            name: 'Frontend',
          },
        ],
        status: TaskStatus.IN_PROGRESS,
        parentTask: {
          id: parentUuid,
        },
      });

      // Verify all fields are passed to database.task.create
      expect(databaseDouble.task.create).toHaveBeenCalledWith({
        data: {
          assignedDeveloperId: devUuid,
          description: null,
          parentTaskId: parentUuid,
          status: TaskStatus.IN_PROGRESS,
          skills: {
            create: [
              {
                skillId: skillUuid,
              },
            ],
          },
          title: 'Add Subtask for #1 V4',
        },
        ...expectedTaskReadInclude,
      });
    });

    it('[DIAGNOSTIC] reports error if assigned developer ID does not exist in database', async () => {
      const nonExistentDevUuid = '0f1919ca-c313-4880-b225-9999999999999';
      const skillUuid = '29f35936-dbdc-4c7e-ad79-52aacb8a5911';
      const parentUuid = '1c4ae6f7-3010-41d0-b5e0-901891f6bbb5';

      const { createTask } = await loadTasksService({
        developerFindUniqueImplementation: async () => null, // Developer doesn't exist
        skillFindManyImplementation: async () => [
          {
            id: skillUuid,
            name: 'Frontend',
          },
        ],
        taskFindUniqueImplementation: async () => ({
          id: parentUuid,
          parentTaskId: null,
        }),
      });

      await expect(
        createTask({
          title: 'Add Subtask for #1 V4',
          description: null,
          assignedDeveloperId: nonExistentDevUuid,
          skillIds: [skillUuid],
          status: TaskStatus.IN_PROGRESS,
          parentTaskId: parentUuid,
        }),
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Developer not found',
        status: StatusCodes.NOT_FOUND,
      });
    });

    it('[DIAGNOSTIC] reports error if skill ID does not exist in database', async () => {
      const devUuid = '0f1919ca-c313-4880-b225-0039256dc47d';
      const nonExistentSkillUuid = '29f35936-dbdc-4c7e-ad79-9999999999999';
      const parentUuid = '1c4ae6f7-3010-41d0-b5e0-901891f6bbb5';

      const { createTask } = await loadTasksService({
        developerFindUniqueImplementation: async () => ({
          id: devUuid,
          skills: [
            {
              skillId: nonExistentSkillUuid,
            },
          ],
        }),
        skillFindManyImplementation: async () => [], // Skill doesn't exist in response
        taskFindUniqueImplementation: async () => ({
          id: parentUuid,
          parentTaskId: null,
        }),
      });

      await expect(
        createTask({
          title: 'Add Subtask for #1 V4',
          description: null,
          assignedDeveloperId: devUuid,
          skillIds: [nonExistentSkillUuid],
          status: TaskStatus.IN_PROGRESS,
          parentTaskId: parentUuid,
        }),
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'One or more skills were not found',
        status: StatusCodes.NOT_FOUND,
      });
    });

    it('[DIAGNOSTIC] reports error if parent task ID does not exist in database', async () => {
      const devUuid = '0f1919ca-c313-4880-b225-0039256dc47d';
      const skillUuid = '29f35936-dbdc-4c7e-ad79-52aacb8a5911';
      const nonExistentParentUuid = '1c4ae6f7-3010-41d0-b5e0-9999999999999';

      const { createTask } = await loadTasksService({
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
            name: 'Frontend',
          },
        ],
        taskFindUniqueImplementation: async () => null, // Parent doesn't exist
      });

      await expect(
        createTask({
          title: 'Add Subtask for #1 V4',
          description: null,
          assignedDeveloperId: devUuid,
          skillIds: [skillUuid],
          status: TaskStatus.IN_PROGRESS,
          parentTaskId: nonExistentParentUuid,
        }),
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Parent task not found',
        status: StatusCodes.NOT_FOUND,
      });
    });
  });
});
