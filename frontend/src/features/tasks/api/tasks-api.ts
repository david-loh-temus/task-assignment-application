import { apiClient, unwrapApiResponse } from '@lib/api/api-client';
import type { ApiClient, ApiSuccessResponse } from '@lib/api/api-client';
import type { Task, UpdateTaskInput } from '@features/tasks/types/task';

/**
 * Fetches the full task collection.
 * @param client HTTP client used to issue the request.
 * @returns Tasks ordered by the backend.
 * @throws {import('@lib/api/api-client').ApiError} When the request fails.
 */
export const getTasks = async (client: ApiClient = apiClient): Promise<Task[]> => {
  const response = await client.get<ApiSuccessResponse<Task[]>>('/tasks');

  return unwrapApiResponse(response.data);
};

/**
 * Fetches a single task by id.
 * @param id Task identifier.
 * @param client HTTP client used to issue the request.
 * @returns The matching task.
 * @throws {import('@lib/api/api-client').ApiError} When the request fails.
 */
export const getTaskById = async (id: string, client: ApiClient = apiClient): Promise<Task> => {
  const response = await client.get<ApiSuccessResponse<Task>>(`/tasks/${id}`);

  return unwrapApiResponse(response.data);
};

/**
 * Partially updates a task by id.
 * @param id Task identifier.
 * @param input Status and/or assignment fields to update.
 * @param client HTTP client used to issue the request.
 * @returns The updated task.
 * @throws {import('@lib/api/api-client').ApiError} When the request fails.
 */
export const updateTaskById = async (
  id: string,
  input: UpdateTaskInput,
  client: ApiClient = apiClient,
): Promise<Task> => {
  const response = await client.patch<ApiSuccessResponse<Task>>(`/tasks/${id}`, input);

  return unwrapApiResponse(response.data);
};
