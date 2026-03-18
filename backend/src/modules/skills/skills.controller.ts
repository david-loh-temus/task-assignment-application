import type { Request, RequestHandler, Response } from 'express';
import { ZodError } from 'zod';

import { sendOk } from '../../shared/api-response';
import { fromZodError } from '../../shared/errors';

import { skillParamsSchema } from './skills.schemas';
import { getSkillById, getSkills } from './skills.service';

const listSkills: RequestHandler = async (_req: Request, res: Response): Promise<void> => {
  const skills = await getSkills();

  sendOk(res, skills);
};

const getSkill: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  let id: string;

  try {
    ({ id } = skillParamsSchema.parse(req.params));
  } catch (error) {
    if (error instanceof ZodError) {
      throw fromZodError(error);
    }

    throw error;
  }

  const skill = await getSkillById(id);

  sendOk(res, skill);
};

export default { listSkills, getSkill };
