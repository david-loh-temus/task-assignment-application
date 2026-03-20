import { describe, expect, it, vi } from 'vitest';

import { getSkills } from '../skills-api';
import type { AxiosResponse } from 'axios';

const skillCollectionFixture = [
  {
    id: 'b345ca84-f9bf-4093-b33e-43556d502458',
    name: 'Backend',
    source: 'HUMAN' as const,
    createdAt: '2026-03-17T18:02:08.028Z',
    updatedAt: '2026-03-17T18:02:08.028Z',
  },
  {
    id: '29f35936-dbdc-4c7e-ad79-52aacb8a5911',
    name: 'Frontend',
    source: 'HUMAN' as const,
    createdAt: '2026-03-17T18:02:08.013Z',
    updatedAt: '2026-03-17T18:02:08.013Z',
  },
];

describe('skills-api', () => {
  it('fetches and unwraps the skills list', async () => {
    const get = vi.fn().mockResolvedValue({
      data: {
        data: skillCollectionFixture,
      },
    } satisfies Pick<AxiosResponse, 'data'>);

    await expect(getSkills({ get } as never)).resolves.toEqual(skillCollectionFixture);
    expect(get).toHaveBeenCalledWith('/skills');
  });
});
