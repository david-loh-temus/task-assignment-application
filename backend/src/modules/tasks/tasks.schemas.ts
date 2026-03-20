import { TaskStatus } from '@prisma/client';
import { z } from 'zod';

const uuidSchema = z.uuid();

export const taskParamsSchema = z.object({
  id: z.uuid('Task id must be a valid UUID'),
});

export const taskCreateBodySchema = z.object({
  assignedDeveloperId: uuidSchema.nullable().optional(),
  description: z.string().trim().optional().nullable(),
  parentTaskId: uuidSchema.nullable().optional(),
  skillIds: z.array(uuidSchema).optional(),
  status: z.enum(Object.values(TaskStatus) as [string, ...string[]]).optional(),
  title: z.string({ error: 'Task title is required' }).trim().min(1, 'Task title is required'),
});

export type TaskCreateBody = z.infer<typeof taskCreateBodySchema>;

export const taskUpdateBodySchema = z
  .object({
    assignedDeveloperId: uuidSchema.nullable().optional(),
    parentTaskId: uuidSchema.nullable().optional(),
    skillIds: z.array(uuidSchema).optional(),
    status: z.enum(Object.values(TaskStatus) as [string, ...string[]]).optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'At least one task field must be provided',
  });

export type TaskUpdateBody = z.infer<typeof taskUpdateBodySchema>;
export type TaskStatusValue = TaskUpdateBody['status'];
