import type { Request, RequestHandler, Response } from 'express';
import { ZodError } from 'zod';

import { sendOk } from '../../shared/api-response';
import { fromZodError } from '../../shared/errors';

import { developerParamsSchema } from './developers.schemas';
import { getDeveloperById, getDevelopers } from './developers.service';

const listDevelopers: RequestHandler = async (_req: Request, res: Response): Promise<void> => {
  const developers = await getDevelopers();

  sendOk(res, developers);
};

const getDeveloper: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  let id: string;

  try {
    ({ id } = developerParamsSchema.parse(req.params));
  } catch (error) {
    if (error instanceof ZodError) {
      throw fromZodError(error);
    }

    throw error;
  }

  const developer = await getDeveloperById(id);

  sendOk(res, developer);
};
export default { listDevelopers, getDeveloper };
