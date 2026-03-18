import { db } from '../../db/database';
import { badRequest, notFound } from '../../shared/errors';

import type { TaskCreateBody, TaskStatusValue, TaskUpdateBody } from './tasks.schemas';
import {
  type TaskReadDto,
  taskReadInclude,
  type TaskRecord,
  taskValidationDeveloperSelect,
  taskValidationSelect,
  taskValidationSkillSelect,
} from './tasks.types';

export type { TaskReadDto } from './tasks.types';

/**
 * Converts a task record to a read DTO.
 * @param record Task record
 * @returns Mapped task DTO
 */
function mapTask(record: TaskRecord): TaskReadDto {
  return {
    assignedDeveloper: record.assignedDeveloper,
    createdAt: record.createdAt.toISOString(),
    description: record.description,
    displayId: record.displayId,
    id: record.id,
    skills: record.skills.map(({ skill }) => ({
      id: skill.id,
      name: skill.name,
    })),
    status: record.status,
    title: record.title,
    updatedAt: record.updatedAt.toISOString(),
  };
}

/**
 * Removes duplicate IDs from an array.
 * @param ids Array of IDs
 * @returns Deduplicated IDs
 */
function dedupeIds(ids: string[] | undefined): string[] {
  return ids ? [...new Set(ids)] : [];
}

/**
 * Fetches a developer by ID with their skills.
 * @param assignedDeveloperId Developer ID
 * @returns Developer with skills or null
 * @throws NotFoundError if developer not found
 */
async function getDeveloperForAssignment(assignedDeveloperId: string | null | undefined): Promise<{
  id: string;
  skills: Array<{ skillId: string }>;
} | null> {
  if (!assignedDeveloperId) {
    return null;
  }

  const developer = await db.developer.findUnique({
    select: taskValidationDeveloperSelect,
    where: {
      id: assignedDeveloperId,
    },
  });

  if (!developer) {
    throw notFound('Developer not found');
  }

  return developer;
}

/**
 * Validates that all provided skills exist.
 * @param skillIds Array of skill IDs to validate
 * @throws NotFoundError if any skill not found
 */
async function assertSkillsExist(skillIds: string[]): Promise<void> {
  if (skillIds.length === 0) {
    return;
  }

  const skills = await db.skill.findMany({
    select: taskValidationSkillSelect,
    where: {
      id: {
        in: skillIds,
      },
    },
  });

  if (skills.length !== skillIds.length) {
    throw notFound('One or more skills were not found');
  }
}

/**
 * Validates developer has all required skills.
 * @param developer Developer with skills or null
 * @param skillIds Required skill IDs
 * @throws BadRequestError if developer missing any skills
 */
function assertDeveloperHasSkills(
  developer: {
    skills: Array<{ skillId: string }>;
  } | null,
  skillIds: string[],
): void {
  if (!developer || skillIds.length === 0) {
    return;
  }

  const developerSkillIds = new Set(developer.skills.map(({ skillId }) => skillId));

  if (skillIds.some((skillId) => !developerSkillIds.has(skillId))) {
    throw badRequest('Assigned developer does not have all required skills');
  }
}

/**
 * Extracts skill IDs from a task.
 * @param task Task with skills
 * @returns Array of skill IDs
 */
function getCurrentSkillIds(task: { skills: Array<{ skillId: string }> }): string[] {
  return task.skills.map(({ skillId }) => skillId);
}

/**
 * Returns the assigned developer ID from input, or falls back to the current
 * task value.
 * @param input Update input with optional developer ID
 * @param task Current task with assigned developer ID
 * @returns Resolved developer ID to set
 */
function resolveAssignedDeveloperId(
  input: Pick<TaskUpdateBody, 'assignedDeveloperId'>,
  task: {
    assignedDeveloperId: string | null;
  },
): string | null {
  if (input.assignedDeveloperId !== undefined) {
    return input.assignedDeveloperId;
  }

  return task.assignedDeveloperId;
}

/**
 * Returns skill IDs from input, or falls back to current task skills.
 * @param input Update input with optional skill IDs
 * @param task Current task with skills
 * @returns Resolved skill IDs to set
 */
function resolveSkillIds(
  input: Pick<TaskUpdateBody, 'skillIds'>,
  task: {
    skills: Array<{ skillId: string }>;
  },
): string[] {
  if (input.skillIds === undefined) {
    return getCurrentSkillIds(task);
  }

  return dedupeIds(input.skillIds);
}

/**
 * Formats input and skill IDs into data structure for task creation.
 * @param input Task creation input
 * @param skillIds Skill IDs to attach
 * @returns Data for creating task
 */
function buildTaskCreateData(
  input: TaskCreateBody,
  skillIds: string[],
): {
  assignedDeveloperId?: string | null;
  description?: string | null;
  skills?: {
    create: Array<{ skillId: string }>;
  };
  title: string;
} {
  const data: {
    assignedDeveloperId?: string | null;
    description?: string | null;
    skills?: {
      create: Array<{ skillId: string }>;
    };
    title: string;
  } = {
    title: input.title,
  };

  if (input.assignedDeveloperId !== undefined) {
    data.assignedDeveloperId = input.assignedDeveloperId;
  }

  if (input.description !== undefined) {
    data.description = input.description;
  }

  if (skillIds.length > 0) {
    data.skills = {
      create: skillIds.map((skillId) => ({
        skillId,
      })),
    };
  }

  return data;
}

/**
 * Formats input and skill IDs into data structure for task update.
 * @param input Task update input
 * @param skillIds Skill IDs to set
 * @returns Data for updating task
 */
function buildTaskUpdateData(
  input: TaskUpdateBody,
  skillIds: string[],
): {
  assignedDeveloperId?: string | null;
  skills?: {
    deleteMany: {};
    create: Array<{ skillId: string }>;
  };
  status?: TaskStatusValue;
} {
  const data: {
    assignedDeveloperId?: string | null;
    skills?: {
      deleteMany: {};
      create: Array<{ skillId: string }>;
    };
    status?: TaskStatusValue;
  } = {};

  if (input.assignedDeveloperId !== undefined) {
    data.assignedDeveloperId = input.assignedDeveloperId;
  }

  if (input.skillIds !== undefined) {
    data.skills = {
      deleteMany: {},
      create: skillIds.map((skillId) => ({
        skillId,
      })),
    };
  }

  if (input.status !== undefined) {
    data.status = input.status;
  }

  return data;
}

/**
 * Retrieves all tasks ordered by display ID.
 * @returns All tasks sorted by display ID ascending
 */
export async function getTasks(): Promise<TaskReadDto[]> {
  const tasks = await db.task.findMany({
    include: taskReadInclude,
    orderBy: {
      displayId: 'asc',
    },
  });

  return tasks.map(mapTask);
}

/**
 * Fetches a task by ID.
 * @param id Task ID
 * @returns Task with given ID
 * @throws NotFoundError if task not found
 */
export async function getTaskById(id: string): Promise<TaskReadDto> {
  const task = await db.task.findUnique({
    include: taskReadInclude,
    where: {
      id,
    },
  });

  if (!task) {
    throw notFound('Task not found');
  }

  return mapTask(task);
}

/**
 * Creates a task with validation.
 * @param input Task creation data
 * @returns Created task
 * @throws NotFoundError if skills or developer not found
 * @throws BadRequestError if developer lacks required skills
 */
export async function createTask(input: TaskCreateBody): Promise<TaskReadDto> {
  const skillIds = dedupeIds(input.skillIds);
  const developer = await getDeveloperForAssignment(input.assignedDeveloperId);

  await assertSkillsExist(skillIds);
  assertDeveloperHasSkills(developer, skillIds);

  const task = await db.task.create({
    data: buildTaskCreateData(input, skillIds),
    include: taskReadInclude,
  });

  return mapTask(task);
}

/**
 * Partially updates a task with validation.
 * @param id Task ID
 * @param input Update data (all fields optional)
 * @returns Updated task
 * @throws NotFoundError if task, skills, or developer not found
 * @throws BadRequestError if developer lacks required skills
 */
export async function updateTaskById(id: string, input: TaskUpdateBody): Promise<TaskReadDto> {
  const existingTask = await db.task.findUnique({
    select: taskValidationSelect,
    where: {
      id,
    },
  });

  if (!existingTask) {
    throw notFound('Task not found');
  }

  const nextSkillIds = resolveSkillIds(input, existingTask);
  const nextAssignedDeveloperId = resolveAssignedDeveloperId(input, existingTask);

  const developer = await getDeveloperForAssignment(nextAssignedDeveloperId);

  if (input.skillIds !== undefined) {
    await assertSkillsExist(nextSkillIds);
  }

  assertDeveloperHasSkills(developer, nextSkillIds);

  const task = await db.$transaction(async (transaction) => {
    return transaction.task.update({
      data: buildTaskUpdateData(input, nextSkillIds),
      include: taskReadInclude,
      where: {
        id,
      },
    });
  });

  return mapTask(task);
}
