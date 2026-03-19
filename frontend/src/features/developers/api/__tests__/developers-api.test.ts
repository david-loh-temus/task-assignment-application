import { describe, expect, it, vi } from 'vitest';

import { developerCollectionFixture, developerFixture } from '@features/developers/__fixtures__/developer-fixtures';
import { getDeveloperById, getDevelopers } from '../developers-api';
import type { AxiosResponse } from 'axios';

describe('developers-api', () => {
  it('fetches and unwraps the developer list', async () => {
    const get = vi.fn().mockResolvedValue({
      data: {
        data: developerCollectionFixture,
      },
    } satisfies Pick<AxiosResponse, 'data'>);

    await expect(getDevelopers({ get } as never)).resolves.toEqual(developerCollectionFixture);
    expect(get).toHaveBeenCalledWith('/developers');
  });

  it('fetches and unwraps a developer by id', async () => {
    const get = vi.fn().mockResolvedValue({
      data: {
        data: developerFixture,
      },
    } satisfies Pick<AxiosResponse, 'data'>);

    await expect(getDeveloperById(developerFixture.id, { get } as never)).resolves.toEqual(developerFixture);
    expect(get).toHaveBeenCalledWith(`/developers/${developerFixture.id}`);
  });
});
