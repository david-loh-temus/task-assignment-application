import { z } from 'zod';

export const developerParamsSchema = z.object({
  id: z.uuid('Developer id must be a valid UUID'),
});
