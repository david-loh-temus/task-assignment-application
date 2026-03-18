import { describe, expect, it } from '@jest/globals';
import { ZodError } from 'zod';

import { skillParamsSchema } from '../skills.schemas';

describe('skills.schemas', () => {
  it('accepts a valid skill id', () => {
    const result = skillParamsSchema.parse({
      id: '0f41b698-2a1d-430f-862e-9566cfcf2896',
    });

    expect(result).toEqual({
      id: '0f41b698-2a1d-430f-862e-9566cfcf2896',
    });
  });

  it('rejects an invalid skill id', () => {
    expect(() => {
      skillParamsSchema.parse({
        id: 'not-a-uuid',
      });
    }).toThrow(ZodError);
  });
});
