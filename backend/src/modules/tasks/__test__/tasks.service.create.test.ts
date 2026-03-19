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
});
