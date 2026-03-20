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
        where: {
          parentTaskId: null,
        },
      });
    });

    it('returns parent task with subtasks including their developer and skills', async () => {
      const parentUuid = '11111111-1111-1111-1111-000000000090';
      const childUuid = '11111111-1111-1111-1111-000000000091';
      const devUuid = '22222222-2222-2222-2222-000000000001';
      const skillUuid = '33333333-3333-3333-3333-000000000001';

      const { databaseDouble, getTasks } = await loadTasksService({
        taskFindManyImplementation: async () => [
          {
            assignedDeveloper: {
              id: '22222222-2222-2222-2222-000000000099',
              name: 'Parent Dev',
            },
            createdAt: new Date('2026-03-18T00:00:00.000Z'),
            description: 'Parent task description',
            displayId: 90,
            id: parentUuid,
            parentTask: null,
            skills: [],
            status: TaskStatus.TODO,
            subtasks: [
              {
                assignedDeveloper: {
                  id: devUuid,
                  name: 'Child Dev',
                },
                createdAt: new Date('2026-03-18T02:00:00.000Z'),
                description: 'Subtask description',
                displayId: 91,
                id: childUuid,
                skills: [
                  {
                    skill: {
                      id: skillUuid,
                      name: 'Frontend',
                    },
                  },
                ],
                status: TaskStatus.IN_PROGRESS,
                title: 'Child Task',
                updatedAt: new Date('2026-03-18T03:00:00.000Z'),
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
        title: 'Parent Task',
        parentTask: null,
      });
      expect(result[0].subtasks).toHaveLength(1);
      expect(result[0].subtasks[0]).toMatchObject({
        displayId: 91,
        id: childUuid,
        title: 'Child Task',
        description: 'Subtask description',
        status: TaskStatus.IN_PROGRESS,
        assignedDeveloper: {
          id: devUuid,
          name: 'Child Dev',
        },
        skills: [
          {
            id: skillUuid,
            name: 'Frontend',
          },
        ],
      });
    });

    it('returns multiple subtasks with their developers and skills intact', async () => {
      const parentUuid = '11111111-1111-1111-1111-000000000100';
      const child1Uuid = '11111111-1111-1111-1111-000000000101';
      const child2Uuid = '11111111-1111-1111-1111-000000000102';
      const dev1Uuid = '22222222-2222-2222-2222-000000000011';
      const dev2Uuid = '22222222-2222-2222-2222-000000000012';
      const skill1Uuid = '33333333-3333-3333-3333-000000000011';
      const skill2Uuid = '33333333-3333-3333-3333-000000000012';

      const { getTasks } = await loadTasksService({
        taskFindManyImplementation: async () => [
          {
            assignedDeveloper: null,
            createdAt: new Date('2026-03-18T00:00:00.000Z'),
            description: 'Parent',
            displayId: 100,
            id: parentUuid,
            parentTask: null,
            skills: [],
            status: TaskStatus.TODO,
            subtasks: [
              {
                assignedDeveloper: {
                  id: dev1Uuid,
                  name: 'Dev One',
                },
                createdAt: new Date('2026-03-18T02:00:00.000Z'),
                description: 'Subtask 1',
                displayId: 101,
                id: child1Uuid,
                skills: [
                  {
                    skill: {
                      id: skill1Uuid,
                      name: 'Backend',
                    },
                  },
                ],
                status: TaskStatus.IN_PROGRESS,
                title: 'Subtask 1',
                updatedAt: new Date('2026-03-18T02:30:00.000Z'),
              },
              {
                assignedDeveloper: {
                  id: dev2Uuid,
                  name: 'Dev Two',
                },
                createdAt: new Date('2026-03-18T03:00:00.000Z'),
                description: 'Subtask 2',
                displayId: 102,
                id: child2Uuid,
                skills: [
                  {
                    skill: {
                      id: skill2Uuid,
                      name: 'Frontend',
                    },
                  },
                ],
                status: TaskStatus.DONE,
                title: 'Subtask 2',
                updatedAt: new Date('2026-03-18T03:30:00.000Z'),
              },
            ],
            title: 'Parent Task',
            updatedAt: new Date('2026-03-18T01:00:00.000Z'),
          },
        ],
      });

      const result = await getTasks();

      expect(result).toHaveLength(1);
      expect(result[0].subtasks).toHaveLength(2);

      // Verify first subtask
      expect(result[0].subtasks[0]).toMatchObject({
        displayId: 101,
        id: child1Uuid,
        title: 'Subtask 1',
        assignedDeveloper: {
          id: dev1Uuid,
          name: 'Dev One',
        },
        skills: [
          {
            id: skill1Uuid,
            name: 'Backend',
          },
        ],
        status: TaskStatus.IN_PROGRESS,
      });

      // Verify second subtask
      expect(result[0].subtasks[1]).toMatchObject({
        displayId: 102,
        id: child2Uuid,
        title: 'Subtask 2',
        assignedDeveloper: {
          id: dev2Uuid,
          name: 'Dev Two',
        },
        skills: [
          {
            id: skill2Uuid,
            name: 'Frontend',
          },
        ],
        status: TaskStatus.DONE,
      });
    });

    it('returns 3-level task hierarchy with all fields at each level', async () => {
      // Level 0: Parent
      const parentUuid = '11111111-1111-1111-1111-000000000110';
      const parentDevUuid = '22222222-2222-2222-2222-000000000110';
      const parentSkillUuid = '33333333-3333-3333-3333-000000000110';

      // Level 1: Subtask
      const subtaskUuid = '11111111-1111-1111-1111-000000000111';
      const subtaskDevUuid = '22222222-2222-2222-2222-000000000111';
      const subtaskSkillUuid = '33333333-3333-3333-3333-000000000111';

      // Level 2: Sub-subtask
      const subsubtaskUuid = '11111111-1111-1111-1111-000000000112';
      const subsubtaskDevUuid = '22222222-2222-2222-2222-000000000112';
      const subsubtaskSkillUuid = '33333333-3333-3333-3333-000000000112';

      const { getTasks } = await loadTasksService({
        taskFindManyImplementation: async () => [
          {
            assignedDeveloper: {
              id: parentDevUuid,
              name: 'Parent Dev',
            },
            createdAt: new Date('2026-03-18T00:00:00.000Z'),
            description: 'Parent task with full details',
            displayId: 110,
            id: parentUuid,
            parentTask: null,
            skills: [
              {
                skill: {
                  id: parentSkillUuid,
                  name: 'Leadership',
                },
              },
            ],
            status: TaskStatus.IN_PROGRESS,
            subtasks: [
              {
                assignedDeveloper: {
                  id: subtaskDevUuid,
                  name: 'Subtask Dev',
                },
                createdAt: new Date('2026-03-18T01:00:00.000Z'),
                description: 'Subtask with full details',
                displayId: 111,
                id: subtaskUuid,
                skills: [
                  {
                    skill: {
                      id: subtaskSkillUuid,
                      name: 'Backend',
                    },
                  },
                ],
                status: TaskStatus.IN_PROGRESS,
                title: 'Subtask Level 1',
                updatedAt: new Date('2026-03-18T01:30:00.000Z'),
                subtasks: [
                  {
                    assignedDeveloper: {
                      id: subsubtaskDevUuid,
                      name: 'Sub-subtask Dev',
                    },
                    createdAt: new Date('2026-03-18T02:00:00.000Z'),
                    description: 'Sub-subtask with full details',
                    displayId: 112,
                    id: subsubtaskUuid,
                    skills: [
                      {
                        skill: {
                          id: subsubtaskSkillUuid,
                          name: 'API Design',
                        },
                      },
                    ],
                    status: TaskStatus.DONE,
                    title: 'Sub-subtask Level 2',
                    updatedAt: new Date('2026-03-18T02:30:00.000Z'),
                  },
                ],
              },
            ],
            title: 'Parent Task Level 0',
            updatedAt: new Date('2026-03-18T00:30:00.000Z'),
          },
        ],
      });

      const result = await getTasks();

      expect(result).toHaveLength(1);
      
      // Verify parent (level 0)
      expect(result[0]).toMatchObject({
        displayId: 110,
        id: parentUuid,
        title: 'Parent Task Level 0',
        assignedDeveloper: {
          id: parentDevUuid,
          name: 'Parent Dev',
        },
        skills: [
          {
            id: parentSkillUuid,
            name: 'Leadership',
          },
        ],
        status: TaskStatus.IN_PROGRESS,
        description: 'Parent task with full details',
      });

      // Verify subtask (level 1)
      expect(result[0].subtasks).toHaveLength(1);
      expect(result[0].subtasks[0]).toMatchObject({
        displayId: 111,
        id: subtaskUuid,
        title: 'Subtask Level 1',
        assignedDeveloper: {
          id: subtaskDevUuid,
          name: 'Subtask Dev',
        },
        skills: [
          {
            id: subtaskSkillUuid,
            name: 'Backend',
          },
        ],
        status: TaskStatus.IN_PROGRESS,
        description: 'Subtask with full details',
      });

      // Verify sub-subtask (level 2)
      expect(result[0].subtasks[0].subtasks).toHaveLength(1);
      expect(result[0].subtasks[0].subtasks[0]).toMatchObject({
        displayId: 112,
        id: subsubtaskUuid,
        title: 'Sub-subtask Level 2',
        assignedDeveloper: {
          id: subsubtaskDevUuid,
          name: 'Sub-subtask Dev',
        },
        skills: [
          {
            id: subsubtaskSkillUuid,
            name: 'API Design',
          },
        ],
        status: TaskStatus.DONE,
        description: 'Sub-subtask with full details',
      });
    });

    it('returns 3-level task hierarchy with minimal fields at each level', async () => {
      const parentUuid = '11111111-1111-1111-1111-000000000120';
      const subtaskUuid = '11111111-1111-1111-1111-000000000121';
      const subsubtaskUuid = '11111111-1111-1111-1111-000000000122';

      const { getTasks } = await loadTasksService({
        taskFindManyImplementation: async () => [
          {
            assignedDeveloper: null,
            createdAt: new Date('2026-03-18T00:00:00.000Z'),
            description: null,
            displayId: 120,
            id: parentUuid,
            parentTask: null,
            skills: [],
            status: TaskStatus.TODO,
            subtasks: [
              {
                assignedDeveloper: null,
                createdAt: new Date('2026-03-18T01:00:00.000Z'),
                description: null,
                displayId: 121,
                id: subtaskUuid,
                skills: [],
                status: TaskStatus.TODO,
                title: 'Subtask Minimal',
                updatedAt: new Date('2026-03-18T01:00:00.000Z'),
                subtasks: [
                  {
                    assignedDeveloper: null,
                    createdAt: new Date('2026-03-18T02:00:00.000Z'),
                    description: null,
                    displayId: 122,
                    id: subsubtaskUuid,
                    skills: [],
                    status: TaskStatus.TODO,
                    title: 'Sub-subtask Minimal',
                    updatedAt: new Date('2026-03-18T02:00:00.000Z'),
                  },
                ],
              },
            ],
            title: 'Parent Minimal',
            updatedAt: new Date('2026-03-18T00:00:00.000Z'),
          },
        ],
      });

      const result = await getTasks();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        displayId: 120,
        title: 'Parent Minimal',
        assignedDeveloper: null,
        skills: [],
        status: TaskStatus.TODO,
      });

      expect(result[0].subtasks).toHaveLength(1);
      expect(result[0].subtasks[0]).toMatchObject({
        displayId: 121,
        title: 'Subtask Minimal',
        assignedDeveloper: null,
        skills: [],
        status: TaskStatus.TODO,
      });

      expect(result[0].subtasks[0].subtasks).toHaveLength(1);
      expect(result[0].subtasks[0].subtasks[0]).toMatchObject({
        displayId: 122,
        title: 'Sub-subtask Minimal',
        assignedDeveloper: null,
        skills: [],
        status: TaskStatus.TODO,
      });
    });

    it('returns 3-level task hierarchy with mixed field combinations', async () => {
      const parentUuid = '11111111-1111-1111-1111-000000000130';
      const subtaskUuid = '11111111-1111-1111-1111-000000000131';
      const subsubtaskUuid = '11111111-1111-1111-1111-000000000132';
      const devUuid = '22222222-2222-2222-2222-000000000130';
      const skillUuid = '33333333-3333-3333-3333-000000000130';

      const { getTasks } = await loadTasksService({
        taskFindManyImplementation: async () => [
          {
            assignedDeveloper: {
              id: devUuid,
              name: 'Developer',
            },
            createdAt: new Date('2026-03-18T00:00:00.000Z'),
            description: null, // No description at level 0
            displayId: 130,
            id: parentUuid,
            parentTask: null,
            skills: [
              {
                skill: {
                  id: skillUuid,
                  name: 'Skill',
                },
              },
            ],
            status: TaskStatus.IN_PROGRESS,
            subtasks: [
              {
                assignedDeveloper: null, // No developer at level 1
                createdAt: new Date('2026-03-18T01:00:00.000Z'),
                description: 'Subtask description',
                displayId: 131,
                id: subtaskUuid,
                skills: [],
                status: TaskStatus.TODO,
                title: 'Subtask Mixed',
                updatedAt: new Date('2026-03-18T01:00:00.000Z'),
                subtasks: [
                  {
                    assignedDeveloper: {
                      id: devUuid,
                      name: 'Developer',
                    },
                    createdAt: new Date('2026-03-18T02:00:00.000Z'),
                    description: null,
                    displayId: 132,
                    id: subsubtaskUuid,
                    skills: [
                      {
                        skill: {
                          id: skillUuid,
                          name: 'Skill',
                        },
                      },
                    ],
                    status: TaskStatus.DONE,
                    title: 'Sub-subtask Mixed',
                    updatedAt: new Date('2026-03-18T02:00:00.000Z'),
                  },
                ],
              },
            ],
            title: 'Parent Mixed',
            updatedAt: new Date('2026-03-18T00:00:00.000Z'),
          },
        ],
      });

      const result = await getTasks();

      expect(result).toHaveLength(1);
      
      // Level 0: has developer and skills
      expect(result[0]).toMatchObject({
        displayId: 130,
        title: 'Parent Mixed',
        assignedDeveloper: {
          id: devUuid,
          name: 'Developer',
        },
        skills: [
          {
            id: skillUuid,
            name: 'Skill',
          },
        ],
        description: null,
        status: TaskStatus.IN_PROGRESS,
      });

      // Level 1: no developer, no skills, has description
      expect(result[0].subtasks[0]).toMatchObject({
        displayId: 131,
        title: 'Subtask Mixed',
        assignedDeveloper: null,
        skills: [],
        description: 'Subtask description',
        status: TaskStatus.TODO,
      });

      // Level 2: has developer and skills, no description
      expect(result[0].subtasks[0].subtasks[0]).toMatchObject({
        displayId: 132,
        title: 'Sub-subtask Mixed',
        assignedDeveloper: {
          id: devUuid,
          name: 'Developer',
        },
        skills: [
          {
            id: skillUuid,
            name: 'Skill',
          },
        ],
        description: null,
        status: TaskStatus.DONE,
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
