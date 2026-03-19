import type { Prisma, SkillSource } from '@prisma/client';

export const skillReadSelect = {
  createdAt: true,
  id: true,
  name: true,
  source: true,
  updatedAt: true,
} satisfies Prisma.SkillSelect;

export const skillClassificationSelect = {
  id: true,
  name: true,
} satisfies Prisma.SkillSelect;

export type SkillRecord = Prisma.SkillGetPayload<{
  select: typeof skillReadSelect;
}>;

export type SkillClassificationRecord = Prisma.SkillGetPayload<{
  select: typeof skillClassificationSelect;
}>;

export type SkillReadDto = {
  id: string;
  name: string;
  source: SkillSource;
  createdAt: string;
  updatedAt: string;
};
