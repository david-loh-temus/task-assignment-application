import { queryOptions, useQuery } from '@tanstack/react-query';

import { getSkills } from '@features/skills/api/skills-api';

export const skillQueryKeys = {
  all: ['skills'] as const,
  list: () => [...skillQueryKeys.all, 'list'] as const,
};

/**
 * Builds query options for the skills collection.
 * @returns Query options for the skills list cache entry.
 */
export const skillsListQueryOptions = () =>
  queryOptions({
    queryKey: skillQueryKeys.list(),
    queryFn: () => getSkills(),
  });

/**
 * Reads the skills collection from the shared query cache.
 * @returns The skills list query result.
 */
export const useSkillsQuery = () => useQuery(skillsListQueryOptions());
