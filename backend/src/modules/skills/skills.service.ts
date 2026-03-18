import { db } from '../../db/database';
import { notFound } from '../../shared/errors';

import { type SkillReadDto, skillReadSelect, type SkillRecord } from './skills.types';

export type { SkillReadDto } from './skills.types';

function mapSkill(record: SkillRecord): SkillReadDto {
  return {
    id: record.id,
    name: record.name,
    source: record.source,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getSkills(): Promise<SkillReadDto[]> {
  const skills = await db.skill.findMany({
    orderBy: {
      name: 'asc',
    },
    select: skillReadSelect,
  });

  return skills.map(mapSkill);
}

export async function getSkillById(id: string): Promise<SkillReadDto> {
  const skill = await db.skill.findUnique({
    select: skillReadSelect,
    where: {
      id,
    },
  });

  if (!skill) {
    throw notFound('Skill not found');
  }

  return mapSkill(skill);
}
