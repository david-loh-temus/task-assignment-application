import 'dotenv/config';
import { PrismaClient, SkillSource } from '@prisma/client';

import logger from '../src/lib/logger';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const frontendSkill = await prisma.skill.upsert({
    where: {
      name: 'Frontend',
    },
    update: {
      source: SkillSource.HUMAN,
    },
    create: {
      name: 'Frontend',
      source: SkillSource.HUMAN,
    },
  });

  const backendSkill = await prisma.skill.upsert({
    where: {
      name: 'Backend',
    },
    update: {
      source: SkillSource.HUMAN,
    },
    create: {
      name: 'Backend',
      source: SkillSource.HUMAN,
    },
  });

  const alice = await prisma.developer.upsert({
    where: {
      name: 'Alice',
    },
    update: {},
    create: {
      name: 'Alice',
    },
  });

  const bob = await prisma.developer.upsert({
    where: {
      name: 'Bob',
    },
    update: {},
    create: {
      name: 'Bob',
    },
  });

  const carol = await prisma.developer.upsert({
    where: {
      name: 'Carol',
    },
    update: {},
    create: {
      name: 'Carol',
    },
  });

  const dave = await prisma.developer.upsert({
    where: {
      name: 'Dave',
    },
    update: {},
    create: {
      name: 'Dave',
    },
  });

  await prisma.developerSkill.upsert({
    where: {
      developerId_skillId: {
        developerId: alice.id,
        skillId: frontendSkill.id,
      },
    },
    update: {},
    create: {
      developerId: alice.id,
      skillId: frontendSkill.id,
    },
  });

  await prisma.developerSkill.upsert({
    where: {
      developerId_skillId: {
        developerId: bob.id,
        skillId: backendSkill.id,
      },
    },
    update: {},
    create: {
      developerId: bob.id,
      skillId: backendSkill.id,
    },
  });

  await prisma.developerSkill.upsert({
    where: {
      developerId_skillId: {
        developerId: carol.id,
        skillId: frontendSkill.id,
      },
    },
    update: {},
    create: {
      developerId: carol.id,
      skillId: frontendSkill.id,
    },
  });

  await prisma.developerSkill.upsert({
    where: {
      developerId_skillId: {
        developerId: carol.id,
        skillId: backendSkill.id,
      },
    },
    update: {},
    create: {
      developerId: carol.id,
      skillId: backendSkill.id,
    },
  });

  await prisma.developerSkill.upsert({
    where: {
      developerId_skillId: {
        developerId: dave.id,
        skillId: backendSkill.id,
      },
    },
    update: {},
    create: {
      developerId: dave.id,
      skillId: backendSkill.id,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    logger.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
