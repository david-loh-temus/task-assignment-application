import { db } from '../../db/database';
import { notFound } from '../../shared/errors';

import { type DeveloperReadDto, developerReadInclude, type DeveloperRecord } from './developers.types';

export type { DeveloperReadDto } from './developers.types';

function mapDeveloper(record: DeveloperRecord): DeveloperReadDto {
  return {
    id: record.id,
    name: record.name,
    // The API flattens join-table internals so callers only receive skill data.
    skills: record.skills.map(({ skill }) => ({
      id: skill.id,
      name: skill.name,
    })),
    tasks: record.tasks.map((task) => ({
      displayId: task.displayId,
      id: task.id,
      status: task.status,
      title: task.title,
    })),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getDevelopers(): Promise<DeveloperReadDto[]> {
  const developers = await db.developer.findMany({
    include: developerReadInclude,
    orderBy: {
      name: 'asc',
    },
  });

  return developers.map(mapDeveloper);
}

export async function getDeveloperById(id: string): Promise<DeveloperReadDto> {
  const developer = await db.developer.findUnique({
    where: {
      id,
    },
    include: developerReadInclude,
  });

  if (!developer) {
    throw notFound('Developer not found');
  }

  return mapDeveloper(developer);
}
