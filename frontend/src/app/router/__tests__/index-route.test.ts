import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';

import { developerQueryKeys } from '@features/developers/queries/developers-queries';
import { skillQueryKeys } from '@features/skills/queries/skills-queries';
import { taskQueryKeys } from '@features/tasks/queries/tasks-queries';
import { Route } from '@routes/index';

describe('tasks route loader', () => {
  it('preloads task and developer collections in the loader', async () => {
    const ensureQueryData = vi.fn().mockResolvedValue(undefined);
    const loader = Route.options.loader as unknown as (input: {
      context: {
        queryClient: {
          ensureQueryData: typeof ensureQueryData;
        };
      };
    }) => Promise<void>;

    await loader({
      context: {
        queryClient: {
          ensureQueryData,
        },
      },
    });

    expect(ensureQueryData.mock.calls[0][0].queryKey).toEqual(taskQueryKeys.list());
    expect(ensureQueryData.mock.calls[1][0].queryKey).toEqual(developerQueryKeys.list());
    expect(ensureQueryData.mock.calls[2][0].queryKey).toEqual(skillQueryKeys.list());
  });
});
