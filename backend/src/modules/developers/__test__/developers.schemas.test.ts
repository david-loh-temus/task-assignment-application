import { describe, expect, it } from '@jest/globals';
import { ZodError } from 'zod';

import { developerParamsSchema } from '../developers.schemas';

describe('developers.schemas', () => {
  it('accepts a valid developer id', () => {
    const result = developerParamsSchema.parse({
      id: '0f41b698-2a1d-430f-862e-9566cfcf2896',
    });

    expect(result).toEqual({
      id: '0f41b698-2a1d-430f-862e-9566cfcf2896',
    });
  });

  it('rejects an invalid developer id', () => {
    expect(() => {
      developerParamsSchema.parse({
        id: 'not-a-uuid',
      });
    }).toThrow(ZodError);
  });
});
