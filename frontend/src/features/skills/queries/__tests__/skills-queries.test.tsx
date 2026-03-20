// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createQueryClient } from '@lib/query/query-client';
import { getSkills } from '@features/skills/api/skills-api';
import { skillQueryKeys, useSkillsQuery } from '../skills-queries';
import type { PropsWithChildren } from 'react';

vi.mock('@features/skills/api/skills-api', () => ({
  getSkills: vi.fn(),
}));

const getSkillsMock = vi.mocked(getSkills);
const skillCollectionFixture = [
  {
    id: 'b345ca84-f9bf-4093-b33e-43556d502458',
    name: 'Backend',
    source: 'HUMAN' as const,
    createdAt: '2026-03-17T18:02:08.028Z',
    updatedAt: '2026-03-17T18:02:08.028Z',
  },
];

describe('skills-queries', () => {
  beforeEach(() => {
    getSkillsMock.mockReset();
  });

  it('uses the shared skills list cache key', () => {
    expect(skillQueryKeys.list()).toEqual(['skills', 'list']);
  });

  it('reads the skills collection through TanStack Query', async () => {
    const queryClient = createQueryClient();
    getSkillsMock.mockResolvedValue(skillCollectionFixture);

    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useSkillsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(skillCollectionFixture);
    expect(getSkillsMock).toHaveBeenCalledTimes(1);
  });
});
