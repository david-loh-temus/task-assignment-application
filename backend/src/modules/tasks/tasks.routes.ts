import { Router } from 'express';

import tasksController from './tasks.controller';

const tasksRouter = Router();

/**
 * @openapi
 * /tasks:
 *   post:
 *     tags:
 *       - Tasks
 *     summary: Create task
 *     description: Creates a new task with optional required skills, optional developer assignment, and optional parent task for creating sub-tasks. Maximum nesting depth is 3 levels (task → sub-task → sub-sub-task).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *                 nullable: true
 *               assignedDeveloperId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               parentTaskId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: ID of the parent task to create a sub-task. Cannot exceed 3 levels of nesting.
 *               skillIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       201:
 *         description: Task created successfully.
 *       400:
 *         description: Task payload is invalid or nesting depth exceeded.
 *       404:
 *         description: Related developer, skill, or parent task was not found.
 */
tasksRouter.post('/', tasksController.createTask);

/**
 * @openapi
 * /tasks:
 *   get:
 *     tags:
 *       - Tasks
 *     summary: List tasks
 *     description: Returns all tasks with their relevant properties.
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully.
 */
tasksRouter.get('/', tasksController.listTasks);

/**
 * @openapi
 * /tasks/{id}:
 *   get:
 *     tags:
 *       - Tasks
 *     summary: Get task by id
 *     description: Returns a task with its relevant properties.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Task retrieved successfully.
 *       400:
 *         description: Task id must be a valid UUID.
 *       404:
 *         description: Task was not found.
 */
tasksRouter.get('/:id', tasksController.getTask);

/**
 * @openapi
 * /tasks/{id}:
 *   patch:
 *     tags:
 *       - Tasks
 *     summary: Update task
 *     description: Updates a task assignment, required skills, status, or parent task (for moving sub-tasks). Cannot mark parent task as DONE if any subtasks are incomplete. Maximum nesting depth is 3 levels.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum:
 *                   - TODO
 *                   - IN_PROGRESS
 *                   - DONE
 *               assignedDeveloperId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               parentTaskId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: ID of the parent task to change hierarchy. Set to null to make top-level. Cannot create circular references or exceed nesting depth.
 *               skillIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Task updated successfully.
 *       400:
 *         description: Task payload is invalid, nesting depth exceeded, circular reference detected, or cannot mark parent as DONE with incomplete subtasks.
 *       404:
 *         description: Task or related records were not found.
 */
tasksRouter.patch('/:id', tasksController.updateTask);

export default tasksRouter;
