import { type Prisma, SkillSource } from '@prisma/client';

import { db } from '../../db/database';
import { badRequest, notFound } from '../../shared/errors';
import { classifyTaskSkills } from '../ai/ai.service';
import { getSkillNamesForAi } from '../skills/skills.service';

import type { TaskCreateBody, TaskUpdateBody } from './tasks.schemas';
import {
  type SubtaskRecord,
  type TaskReadDto,
  taskReadInclude,
  type TaskRecord,
  taskValidationDeveloperSelect,
  taskValidationParentSelect,
  taskValidationSelect,
  taskValidationSkillSelect,
} from './tasks.types';

export type { TaskReadDto } from './tasks.types';

/**
 * Maximum task nesting depth (task → subtask → sub-subtask).
 * Prevents excessive hierarchy complexity and maintains UI simplicity.
 */
const MAX_NESTING_DEPTH = 3;

/**
 * Formats a task's skills array into DTOs.
 * @param skills Task skills with nested skill objects
 * @returns Formatted skills array
 */
function mapTaskSkills(skills: Array<{ skill: { id: string; name: string } }> | undefined | null): Array<{
  id: string;
  name: string;
}> {
  if (!skills) {
    return [];
  }
  return skills.map((s) => ({
    id: s.skill.id,
    name: s.skill.name,
  }));
}

/**
 * Converts a task record to a read DTO.
 *
 * Note: Subtasks are recursively mapped with full fields (including their subtasks).
 * Nested properties up to MAX_NESTING_DEPTH levels are preserved.
 * ParentTask is omitted from subtasks to avoid circular references.
 *
 * @param record Task record from database
 * @returns Mapped task DTO with full hierarchical subtasks
 */
function mapTask(record: TaskRecord): TaskReadDto {
  let parentTask = null;
  if (record.parentTask) {
    parentTask = {
      displayId: record.parentTask.displayId,
      id: record.parentTask.id,
      title: record.parentTask.title,
    };
  }

  // Map subtasks recursively
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subtasks: TaskReadDto[] = record.subtasks.map((subtask) => mapSubtask(subtask as any));

  return {
    assignedDeveloper: record.assignedDeveloper,
    createdAt: record.createdAt.toISOString(),
    description: record.description,
    displayId: record.displayId,
    id: record.id,
    parentTask,
    skills: mapTaskSkills(record.skills),
    status: record.status,
    subtasks,
    title: record.title,
    updatedAt: record.updatedAt.toISOString(),
  };
}

/**
 * Maps a subtask record (and its sub-subtasks) recursively.
 * @param subtask Subtask record from database
 * @returns Mapped subtask DTO
 */
function mapSubtask(subtask: SubtaskRecord): TaskReadDto {
  let subtaskAssignedDeveloper = null;
  if (subtask.assignedDeveloper) {
    subtaskAssignedDeveloper = {
      id: subtask.assignedDeveloper.id,
      name: subtask.assignedDeveloper.name,
    };
  }

  const subtaskSkills = mapTaskSkills(subtask.skills);

  // Recursively map nested subtasks
  const nestedSubtasks: TaskReadDto[] = (subtask.subtasks ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (subsubtask: any) => mapSubtask(subsubtask),
  );

  return {
    assignedDeveloper: subtaskAssignedDeveloper,
    createdAt: subtask.createdAt.toISOString(),
    description: subtask.description,
    displayId: subtask.displayId,
    id: subtask.id,
    parentTask: null, // Omitted to avoid circular references
    skills: subtaskSkills,
    status: subtask.status,
    subtasks: nestedSubtasks,
    title: subtask.title,
    updatedAt: subtask.updatedAt.toISOString(),
  };
}

/**
 * Removes duplicate IDs from an array.
 * @param ids Array of IDs
 * @returns Deduplicated IDs
 */
function dedupeIds(ids: string[] | undefined): string[] {
  if (ids) {
    return [...new Set(ids)];
  }
  return [];
}

function dedupeSkillNames(names: string[]): string[] {
  return [...new Set(names.map((name) => name.trim().toLowerCase()).filter((name) => name.length > 0))];
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

async function getGeneratedSkillNames(taskTitle: string): Promise<string[]> {
  const existingSkillNames = await getSkillNamesForAi();
  const generatedSkillNames = await classifyTaskSkills(taskTitle, JSON.stringify(existingSkillNames));

  if (generatedSkillNames.length === 0) {
    throw badRequest('Gemini did not return any required skills');
  }

  return dedupeSkillNames(generatedSkillNames);
}

/**
 * Resolves skill IDs by name, creating new skills with LLM source if needed.
 *
 * First queries existing skills for efficiency, then uses upsert with Promise.all
 * for missing skills to handle race conditions where multiple concurrent requests
 * try to create the same skill. The unique constraint on skill.name ensures data integrity.
 *
 * NOTE: If a skill already exists (created by human or previous LLM run),
 * its original source is preserved via empty update clause.
 */
async function resolveSkillIdsByName(
  transaction: Pick<Prisma.TransactionClient, 'skill'>,
  skillNames: string[],
): Promise<string[]> {
  const normalizedSkillNames = dedupeSkillNames(skillNames);
  const existingSkills = await transaction.skill.findMany({
    select: {
      id: true,
      name: true,
    },
    where: {
      name: {
        in: normalizedSkillNames,
      },
    },
  });

  const existingSkillIdsByName = new Map(existingSkills.map((skill) => [skill.name, skill.id]));
  const missingSkillNames = normalizedSkillNames.filter((name) => !existingSkillIdsByName.has(name));

  // Use Promise.all with upsert for missing skills to handle race conditions
  // The unique constraint on name prevents duplicates across concurrent requests
  if (missingSkillNames.length > 0) {
    const createdSkills = await Promise.all(
      missingSkillNames.map((skillName) =>
        transaction.skill.upsert({
          create: {
            name: skillName,
            source: SkillSource.LLM,
          },
          update: {}, // No-op if exists - preserves original source
          where: {
            name: skillName,
          },
        }),
      ),
    );

    // Add newly created skills to the map
    createdSkills.forEach((skill) => {
      existingSkillIdsByName.set(skill.name, skill.id);
    });
  }

  // Return IDs in the same order as input skill names
  return normalizedSkillNames.map((name) => existingSkillIdsByName.get(name)!);
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
 * Fetches a parent task for validation with its parent chain.
 * @param parentTaskId Parent task ID
 * @returns Parent task with parent chain or null
 * @throws NotFoundError if parent task not found
 */
async function getParentTaskForValidation(
  parentTaskId: string | null | undefined,
): Promise<{ id: string; parentTaskId: string | null } | null> {
  if (!parentTaskId) {
    return null;
  }

  const parentTask = await db.task.findUnique({
    select: taskValidationParentSelect,
    where: {
      id: parentTaskId,
    },
  });

  if (!parentTask) {
    throw notFound('Parent task not found');
  }

  return parentTask;
}

/**
 * Validates parent task assignment by checking nesting depth and circular references.
 *
 * Walks up the parent chain (parent → grandparent → ...) to ensure:
 * 1. Maximum nesting depth of 3 levels is not exceeded
 * 2. No circular reference (taskId doesn't appear in the parent chain, if taskId provided)
 *
 * Both checks are combined in one traversal for efficiency: O(depth) vs O(2*depth).
 *
 * @param taskId The task being assigned a parent (null for new tasks during creation)
 * @param parentTask The parent task with its parent chain
 * @throws BadRequestError if nesting depth exceeded or circular reference detected
 */
async function assertValidParentTask(
  taskId: string | null,
  parentTask: { id: string; parentTaskId: string | null },
): Promise<void> {
  // Self-reference check (only applicable when task already exists)
  if (taskId && taskId === parentTask.id) {
    throw badRequest('A task cannot be its own parent');
  }

  // Walk up parent chain, checking depth and circular reference simultaneously
  let depth = 1; // Starting at parent level
  let current: { id: string; parentTaskId: string | null } | null = parentTask;

  while (current?.parentTaskId) {
    depth += 1;

    if (depth >= MAX_NESTING_DEPTH) {
      throw badRequest('Task nesting depth cannot exceed 3 levels (task → sub-task → sub-sub-task)');
    }

    // Detect cycle: if taskId appears in the parent chain, it's circular
    // (only check if taskId provided - not applicable during task creation)
    if (taskId && current.parentTaskId === taskId) {
      throw badRequest('Moving this task would create a circular reference');
    }

    current = await db.task.findUnique({
      select: taskValidationParentSelect,
      where: {
        id: current.parentTaskId,
      },
    });

    if (!current) {
      break;
    }
  }
}

/**
 * Fetches all incomplete subtasks at any depth using a recursive query.
 *
 * Uses PostgreSQL recursive CTE to:
 * 1. Start with immediate subtasks (base case)
 * 2. Recursively find subtasks of subtasks (recursive case)
 * 3. Filter to only incomplete (status != 'DONE') tasks
 *
 * More efficient than N queries (one per level) - single database roundtrip.
 * Raw SQL is used because Prisma doesn't support recursive CTEs.
 *
 * @param taskId Parent task ID to check
 * @returns Array of incomplete subtask IDs (empty if all subtasks are DONE)
 */
async function getIncompleteSubtasks(taskId: string): Promise<string[]> {
  const result = await db.$queryRaw<Array<{ id: string }>>`
    WITH RECURSIVE subtask_tree AS (
      -- Base case: immediate subtasks
      SELECT id, status, parent_task_id
      FROM tasks
      WHERE parent_task_id = ${taskId}::uuid
      
      UNION ALL
      
      -- Recursive case: subtasks of subtasks
      SELECT t.id, t.status, t.parent_task_id
      FROM tasks t
      INNER JOIN subtask_tree st ON t.parent_task_id = st.id
    )
    -- Filter to only incomplete tasks
    SELECT id
    FROM subtask_tree
    WHERE status != 'DONE'
  `;

  return result.map((row) => row.id);
}

/**
 * Validates that all subtasks are DONE before marking parent as DONE.
 * @param taskId Task ID
 * @throws BadRequestError if any subtask is not DONE
 */
async function assertAllSubtasksDone(taskId: string): Promise<void> {
  const incompleteSubtasks = await getIncompleteSubtasks(taskId);

  if (incompleteSubtasks.length > 0) {
    throw badRequest(`Cannot mark task as DONE. ${incompleteSubtasks.length} subtask(s) are not yet complete.`);
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
 * Returns the assigned developer ID from input, or current task value.
 */
function resolveAssignedDeveloperId(
  input: Pick<TaskUpdateBody, 'assignedDeveloperId'>,
  task: { assignedDeveloperId: string | null },
): string | null {
  if (input.assignedDeveloperId !== undefined) {
    return input.assignedDeveloperId;
  }
  return task.assignedDeveloperId;
}

/**
 * Returns the parent task ID from input, or current task value.
 */
function resolveParentTaskId(
  input: Pick<TaskUpdateBody, 'parentTaskId'>,
  task: { parentTaskId: string | null },
): string | null {
  if (input.parentTaskId !== undefined) {
    return input.parentTaskId;
  }
  return task.parentTaskId;
}

/**
 * Returns skill IDs from input, or current task skills.
 */
function resolveSkillIds(
  input: Pick<TaskUpdateBody, 'skillIds'>,
  task: { skills: Array<{ skillId: string }> },
): string[] {
  if (input.skillIds !== undefined) {
    return dedupeIds(input.skillIds);
  }
  return getCurrentSkillIds(task);
}

/**
 * Formats input and skill IDs into data structure for task creation.
 * @param input Task creation input
 * @param skillIds Skill IDs to attach
 * @returns Data for creating task
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildTaskCreateData(input: TaskCreateBody, skillIds: string[]): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {
    title: input.title,
  };

  if (input.assignedDeveloperId !== undefined && input.assignedDeveloperId !== null) {
    data.assignedDeveloperId = input.assignedDeveloperId;
  }

  if (input.description !== undefined) {
    data.description = input.description;
  }

  if (input.parentTaskId !== undefined && input.parentTaskId !== null) {
    data.parentTaskId = input.parentTaskId;
  }

  if (input.status !== undefined) {
    data.status = input.status;
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildTaskUpdateData(input: TaskUpdateBody, skillIds: string[]): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};

  if (input.assignedDeveloperId !== undefined) {
    data.assignedDeveloperId = input.assignedDeveloperId;
  }

  if (input.parentTaskId !== undefined) {
    data.parentTaskId = input.parentTaskId;
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
    where: {
      parentTaskId: null,
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
 * @throws NotFoundError if skills, developer, or parent task not found
 * @throws BadRequestError if developer lacks required skills or nesting depth exceeded
 */
export async function createTask(input: TaskCreateBody): Promise<TaskReadDto> {
  const skillIds = dedupeIds(input.skillIds);
  const developer = await getDeveloperForAssignment(input.assignedDeveloperId);
  const parentTask = await getParentTaskForValidation(input.parentTaskId);

  if (parentTask) {
    // During creation, task ID doesn't exist yet, so only nesting depth is validated
    await assertValidParentTask(null, parentTask);
  }

  if (skillIds.length > 0) {
    await assertSkillsExist(skillIds);
    assertDeveloperHasSkills(developer, skillIds);

    const task = await db.task.create({
      data: buildTaskCreateData(input, skillIds),
      include: taskReadInclude,
    });

    return mapTask(task);
  }

  const generatedSkillNames = await getGeneratedSkillNames(input.title);
  const task = await db.$transaction(async (transaction) => {
    const generatedSkillIds = await resolveSkillIdsByName(transaction, generatedSkillNames);

    assertDeveloperHasSkills(developer, generatedSkillIds);

    return transaction.task.create({
      data: buildTaskCreateData(input, generatedSkillIds),
      include: taskReadInclude,
    });
  });

  return mapTask(task);
}

/**
 * Partially updates a task with validation.
 * @param id Task ID
 * @param input Update data (all fields optional)
 * @returns Updated task
 * @throws NotFoundError if task, skills, developer, or parent task not found
 * @throws BadRequestError if developer lacks required skills, nesting depth exceeded, circular reference detected, or status validation fails
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
  const nextParentTaskId = resolveParentTaskId(input, existingTask);

  const developer = await getDeveloperForAssignment(nextAssignedDeveloperId);

  if (input.skillIds !== undefined) {
    await assertSkillsExist(nextSkillIds);
  }

  assertDeveloperHasSkills(developer, nextSkillIds);

  // Validate parent task changes
  if (input.parentTaskId !== undefined && nextParentTaskId) {
    const newParentTask = await getParentTaskForValidation(nextParentTaskId);
    if (newParentTask) {
      await assertValidParentTask(id, newParentTask);
    }
  }

  // Validate status changes
  if (input.status === 'DONE') {
    await assertAllSubtasksDone(id);
  }

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
