import { apiClient, unwrapApiResponse } from '@lib/api/api-client';
import type { ApiClient, ApiSuccessResponse } from '@lib/api/api-client';
import type { Developer } from '@features/developers/types/developer';

/**
 * Fetches the full developer collection.
 * @param client HTTP client used to issue the request.
 * @returns Developers ordered by the backend.
 * @throws {import('@lib/api/api-client').ApiError} When the request fails.
 */
export const getDevelopers = async (client: ApiClient = apiClient): Promise<Developer[]> => {
  const response = await client.get<ApiSuccessResponse<Developer[]>>('/developers');

  return unwrapApiResponse(response.data);
};

/**
 * Fetches a single developer by id.
 * @param id Developer identifier.
 * @param client HTTP client used to issue the request.
 * @returns The matching developer.
 * @throws {import('@lib/api/api-client').ApiError} When the request fails.
 */
export const getDeveloperById = async (id: string, client: ApiClient = apiClient): Promise<Developer> => {
  const response = await client.get<ApiSuccessResponse<Developer>>(`/developers/${id}`);

  return unwrapApiResponse(response.data);
};
