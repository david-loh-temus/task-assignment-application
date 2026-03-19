import { describe, expect, it, vi } from 'vitest';

import { taskCollectionFixture, taskFixture } from '@features/tasks/__fixtures__/task-fixtures';
import { getTaskById, getTasks, updateTaskById } from '../tasks-api';
import type { AxiosResponse } from 'axios';

describe('tasks-api', () => {
  it('fetches and unwraps the task list', async () => {
    const get = vi.fn().mockResolvedValue({
      data: {
        data: taskCollectionFixture,
      },
    } satisfies Pick<AxiosResponse, 'data'>);

    await expect(getTasks({ get } as never)).resolves.toEqual(taskCollectionFixture);
    expect(get).toHaveBeenCalledWith('/tasks');
  });

  it('fetches and unwraps a task by id', async () => {
    const get = vi.fn().mockResolvedValue({
      data: {
        data: taskFixture,
      },
    } satisfies Pick<AxiosResponse, 'data'>);

    await expect(getTaskById(taskFixture.id, { get } as never)).resolves.toEqual(taskFixture);
    expect(get).toHaveBeenCalledWith(`/tasks/${taskFixture.id}`);
  });

  it('updates and unwraps a task by id', async () => {
    const patch = vi.fn().mockResolvedValue({
      data: {
        data: {
          ...taskFixture,
          status: 'DONE',
        },
      },
    } satisfies Pick<AxiosResponse, 'data'>);

    await expect(updateTaskById(taskFixture.id, { status: 'DONE' }, { patch } as never)).resolves.toEqual({
      ...taskFixture,
      status: 'DONE',
    });
    expect(patch).toHaveBeenCalledWith(`/tasks/${taskFixture.id}`, { status: 'DONE' });
  });
});
