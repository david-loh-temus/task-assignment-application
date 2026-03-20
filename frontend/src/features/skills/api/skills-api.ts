import { apiClient, unwrapApiResponse } from '@lib/api/api-client';
import type { ApiClient, ApiSuccessResponse } from '@lib/api/api-client';
import type { Skill } from '@features/skills/types/skill';

/**
 * Fetches the full skills collection.
 * @param client HTTP client used to issue the request.
 * @returns Skills ordered by the backend.
 * @throws {import('@lib/api/api-client').ApiError} When the request fails.
 */
export const getSkills = async (client: ApiClient = apiClient): Promise<Skill[]> => {
  const response = await client.get<ApiSuccessResponse<Skill[]>>('/skills');

  return unwrapApiResponse(response.data);
};
