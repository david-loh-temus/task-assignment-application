import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodError } from 'zod';

import { sendOk } from '../../shared/api-response';
import { badRequest } from '../../shared/errors';

import { developerParamsSchema } from './developers.schemas';
import { getDeveloperById, getDevelopers } from './developers.service';

const listDevelopers: RequestHandler = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const developers = await getDevelopers();

    sendOk(res, developers);
  } catch (error) {
    next(error);
  }
};

const getDeveloper: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = developerParamsSchema.parse(req.params);
    const developer = await getDeveloperById(id);

    sendOk(res, developer);
  } catch (error) {
    if (error instanceof ZodError) {
      next(badRequest('Developer id must be a valid UUID'));
      return;
    }

    next(error);
  }
};
export default { listDevelopers, getDeveloper };
