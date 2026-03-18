import type { Request, RequestHandler, Response } from 'express';
import { ZodError } from 'zod';

import { sendCreated, sendOk } from '../../shared/api-response';
import { fromZodError } from '../../shared/errors';

import {
  type TaskCreateBody,
  type TaskUpdateBody,
  taskCreateBodySchema,
  taskParamsSchema,
  taskUpdateBodySchema,
} from './tasks.schemas';
import { createTask, getTaskById, getTasks, updateTaskById } from './tasks.service';

const listTasks: RequestHandler = async (_req: Request, res: Response): Promise<void> => {
  const tasks = await getTasks();

  sendOk(res, tasks);
};

const getTask: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  let id: string;

  try {
    ({ id } = taskParamsSchema.parse(req.params));
  } catch (error) {
    if (error instanceof ZodError) {
      throw fromZodError(error);
    }

    throw error;
  }

  const task = await getTaskById(id);

  sendOk(res, task);
};

const createTaskHandler: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  let body: TaskCreateBody;

  try {
    body = taskCreateBodySchema.parse(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw fromZodError(error);
    }

    throw error;
  }

  const task = await createTask(body);

  sendCreated(res, task);
};

const updateTask: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  let id: string;
  let body: TaskUpdateBody;

  try {
    ({ id } = taskParamsSchema.parse(req.params));
    body = taskUpdateBodySchema.parse(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw fromZodError(error);
    }

    throw error;
  }

  const task = await updateTaskById(id, body);

  sendOk(res, task);
};

export default {
  createTask: createTaskHandler,
  getTask,
  listTasks,
  updateTask,
};
