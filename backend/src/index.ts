import express from 'express';
import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

const DEFAULT_PORT = 4000;

const app = express();
const port = Number(process.env.PORT ?? DEFAULT_PORT);

app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.sendStatus(StatusCodes.OK);
});

app.listen(port, () => {
  /* eslint-disable no-console */
  console.log(`Task Assignment backend listening on port ${port}`);
});
