import { jest } from '@jest/globals';

import type * as TasksService from '../../modules/tasks/tasks.service';

/**
 * Database test double type
 * Represents a mocked database instance for testing
 */
export type DatabaseDouble = {
  developer: {
    findUnique: jest.Mock;
  };
  skill: {
    findMany: jest.Mock;
  };
  task: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  $queryRaw: jest.Mock;
  $transaction: jest.Mock;
} & Record<string, unknown>;

/**
 * Load tasks service with mocked database dependencies
 * This helper creates a fresh instance of the tasks service with customizable mock implementations
 */
export async function loadTasksService({
  developerFindUniqueImplementation,
  skillFindManyImplementation,
  taskCreateImplementation,
  taskFindManyImplementation,
  taskFindUniqueImplementation,
  taskUpdateImplementation,
  transactionImplementation,
}: {
  developerFindUniqueImplementation?: () => Promise<unknown>;
  skillFindManyImplementation?: () => Promise<unknown>;
  taskCreateImplementation?: () => Promise<unknown>;
  taskFindManyImplementation?: () => Promise<unknown>;
  taskFindUniqueImplementation?: (args: unknown) => Promise<unknown>;
  taskUpdateImplementation?: () => Promise<unknown>;
  transactionImplementation?: (callback: (database: DatabaseDouble) => Promise<unknown>) => Promise<unknown>;
} = {}): Promise<typeof TasksService & { databaseDouble: DatabaseDouble }> {
  jest.resetModules();

  const databaseDouble: DatabaseDouble = {
    $queryRaw: jest.fn(async () => []),
    $transaction: jest.fn(
      transactionImplementation ??
        (async (callback: (database: DatabaseDouble) => Promise<unknown>) => callback(databaseDouble)),
    ) as unknown as jest.Mock,
    developer: {
      findUnique: jest.fn(developerFindUniqueImplementation ?? (async () => null)),
    },
    skill: {
      findMany: jest.fn(skillFindManyImplementation ?? (async () => [])),
    },
    task: {
      create: jest.fn(taskCreateImplementation ?? (async () => null)),
      findMany: jest.fn(taskFindManyImplementation ?? (async () => [])),
      findUnique: jest.fn(taskFindUniqueImplementation ?? (async () => null)),
      update: jest.fn(taskUpdateImplementation ?? (async () => null)),
    },
  };

  jest.doMock('../../db/database', () => ({
    __esModule: true,
    db: databaseDouble,
  }));

  const serviceModule =
    require('../../modules/tasks/tasks.service') as typeof import('../../modules/tasks/tasks.service');

  return {
    ...serviceModule,
    databaseDouble,
  };
}
