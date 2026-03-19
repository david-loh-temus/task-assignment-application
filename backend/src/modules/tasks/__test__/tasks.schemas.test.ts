import { describe, expect, it } from '@jest/globals';
import { TaskStatus } from '@prisma/client';
import { ZodError } from 'zod';

import { taskCreateBodySchema, taskParamsSchema, taskUpdateBodySchema } from '../tasks.schemas';

describe('tasks.schemas', () => {
  it('accepts a valid task id', () => {
    const result = taskParamsSchema.parse({
      id: '0f41b698-2a1d-430f-862e-9566cfcf2896',
    });

    expect(result).toEqual({
      id: '0f41b698-2a1d-430f-862e-9566cfcf2896',
    });
  });

  it('rejects an invalid task id', () => {
    expect(() => {
      taskParamsSchema.parse({
        id: 'not-a-uuid',
      });
    }).toThrow(ZodError);
  });

  it('accepts a minimal task create payload', () => {
    const result = taskCreateBodySchema.parse({
      title: 'Build API',
    });

    expect(result).toEqual({
      title: 'Build API',
    });
  });

  it('accepts a task create payload with relations', () => {
    const result = taskCreateBodySchema.parse({
      assignedDeveloperId: '0f41b698-2a1d-430f-862e-9566cfcf2896',
      description: 'Implement the backend endpoints',
      skillIds: ['11f41b69-82a1-430f-862e-9566cfcf2896'],
      title: 'Build API',
    });

    expect(result).toEqual({
      assignedDeveloperId: '0f41b698-2a1d-430f-862e-9566cfcf2896',
      description: 'Implement the backend endpoints',
      skillIds: ['11f41b69-82a1-430f-862e-9566cfcf2896'],
      title: 'Build API',
    });
  });

  it('rejects invalid identifiers in the task create payload', () => {
    expect(() => {
      taskCreateBodySchema.parse({
        assignedDeveloperId: 'bad-id',
        skillIds: ['still-bad'],
        title: 'Build API',
      });
    }).toThrow(ZodError);
  });

  it('accepts a valid task update payload', () => {
    const result = taskUpdateBodySchema.parse({
      assignedDeveloperId: null,
      skillIds: [],
      status: TaskStatus.IN_PROGRESS,
    });

    expect(result).toEqual({
      assignedDeveloperId: null,
      skillIds: [],
      status: TaskStatus.IN_PROGRESS,
    });
  });

  it('rejects an empty task update payload', () => {
    expect(() => {
      taskUpdateBodySchema.parse({});
    }).toThrow(ZodError);
  });

  it('rejects an invalid task status', () => {
    expect(() => {
      taskUpdateBodySchema.parse({
        status: 'BLOCKED',
      });
    }).toThrow(ZodError);
  });

  describe('sub-tasks parenting', () => {
    it('accepts a task create payload with parentTaskId', () => {
      const result = taskCreateBodySchema.parse({
        parentTaskId: '0f41b698-2a1d-430f-862e-9566cfcf2896',
        title: 'Sub Task',
      });

      expect(result).toEqual({
        parentTaskId: '0f41b698-2a1d-430f-862e-9566cfcf2896',
        title: 'Sub Task',
      });
    });

    it('accepts a task create payload with null parentTaskId', () => {
      const result = taskCreateBodySchema.parse({
        parentTaskId: null,
        title: 'Top Level Task',
      });

      expect(result).toEqual({
        parentTaskId: null,
        title: 'Top Level Task',
      });
    });

    it('rejects a task create payload with invalid parentTaskId', () => {
      expect(() => {
        taskCreateBodySchema.parse({
          parentTaskId: 'not-a-uuid',
          title: 'Sub Task',
        });
      }).toThrow(ZodError);
    });

    it('accepts a task update payload with parentTaskId', () => {
      const result = taskUpdateBodySchema.parse({
        parentTaskId: '0f41b698-2a1d-430f-862e-9566cfcf2896',
      });

      expect(result).toEqual({
        parentTaskId: '0f41b698-2a1d-430f-862e-9566cfcf2896',
      });
    });

    it('accepts a task update payload to set parentTaskId to null', () => {
      const result = taskUpdateBodySchema.parse({
        parentTaskId: null,
      });

      expect(result).toEqual({
        parentTaskId: null,
      });
    });

    it('accepts a task update payload with status and parentTaskId', () => {
      const result = taskUpdateBodySchema.parse({
        parentTaskId: null,
        status: TaskStatus.DONE,
      });

      expect(result).toEqual({
        parentTaskId: null,
        status: TaskStatus.DONE,
      });
    });

    it('rejects a task update payload with invalid parentTaskId', () => {
      expect(() => {
        taskUpdateBodySchema.parse({
          parentTaskId: 'bad-id',
        });
      }).toThrow(ZodError);
    });
  });
});
