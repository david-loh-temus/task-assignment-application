import { Router } from 'express';

import developersController from './developers.controller';

const developersRouter = Router();

/**
 * @openapi
 * /developers:
 *   get:
 *     tags:
 *       - Developers
 *     summary: List developers
 *     description: Returns all developers with their relevant properties.
 *     responses:
 *       200:
 *         description: Developers retrieved successfully.
 */
developersRouter.get('/', developersController.listDevelopers);

/**
 * @openapi
 * /developers/{id}:
 *   get:
 *     tags:
 *       - Developers
 *     summary: Get developer by id
 *     description: Returns a developer with their relevant properties.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Developer retrieved successfully.
 *       400:
 *         description: Developer id must be a valid UUID.
 *       404:
 *         description: Developer was not found.
 */
developersRouter.get('/:id', developersController.getDeveloper);

export default developersRouter;
