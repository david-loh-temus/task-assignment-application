import { z } from 'zod';

export const skillParamsSchema = z.object({
  id: z.uuid('Skill id must be a valid UUID'),
});
