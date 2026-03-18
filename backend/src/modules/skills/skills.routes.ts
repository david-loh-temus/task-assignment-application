import { Router } from 'express';

import skillsController from './skills.controller';

const skillsRouter = Router();

/**
 * @openapi
 * /skills:
 *   get:
 *     tags:
 *       - Skills
 *     summary: List skills
 *     description: Returns all skills with their relevant properties.
 *     responses:
 *       200:
 *         description: Skills retrieved successfully.
 */
skillsRouter.get('/', skillsController.listSkills);

/**
 * @openapi
 * /skills/{id}:
 *   get:
 *     tags:
 *       - Skills
 *     summary: Get skill by id
 *     description: Returns a skill with its relevant properties.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Skill retrieved successfully.
 *       400:
 *         description: Skill id must be a valid UUID.
 *       404:
 *         description: Skill was not found.
 */
skillsRouter.get('/:id', skillsController.getSkill);

export default skillsRouter;
