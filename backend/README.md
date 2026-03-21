# Task Assignment API Service

This directory contains the backend API service for the Task Assignment application.

## Tech Stack

- Node.js
- TypeScript
- Express
- Prisma (ORM)
- @prisma/client
- Pino
- Zod

## Directory Structure

```text
backend/
├── src/
│   ├── app/
│   ├── config/
│   ├── db/
│   │   ├── migrations/
│   │   └── seeds/
│   ├── lib/
│   ├── modules/
│   │   ├── ai/
│   │   ├── developers/
│   │   ├── skills/
│   │   └── tasks/
│   ├── shared/
│   └── index.ts
├── eslint.config.js
├── package.json
└── tsconfig.json
```

## Setup

Install root dependencies first, then install backend dependencies.

Root:

```bash
cd ..
npm install
```

Backend:

```bash
npm install
```

Environment: copy `.env.example` to `.env` and set `DATABASE_URL` (Prisma), `GEMINI_API_KEY` and other secrets as needed.

Important: when running the full stack with Docker Compose, ensure `GEMINI_API_KEY` is set in the `.env` file or the compose environment. The backend relies on the Gemini LLM for automatic skill classification and related LLM features — the service will not be fully operational for LLM-dependent endpoints without this key.

## Local Development

1. Start PostgreSQL from the repository root:

```bash
cd ..
docker compose -f docker-compose.dev.yml up db
```

2. Start the backend:

```bash
npm run dev
```

Health endpoint (default): `http://127.0.0.1:4000/health`

Notes:
- The service expects `DATABASE_URL` for Prisma; set it in `.env` or your environment.
- The default port is `4000` (see `src/config/config.ts`).

### Prisma Workflow for Schema Changes

When making schema changes during local development:

1. Edit `prisma/schema.prisma` with your changes
2. Create and apply the migration:
   ```bash
   npm run prisma:migrate:dev --name describe_your_change
   ```
   This command:
   - Formats and validates your schema
   - Generates SQL migration file
   - Applies the migration to your local database
   - Automatically regenerates the Prisma client

3. (Optional) Seed test data:
   ```bash
   npm run prisma:seed
   ```

4. Commit both `prisma/schema.prisma` and any new migration files in `prisma/migrations/` to source control

### Prisma Client Generation

The Prisma client is automatically regenerated when:
- You run `prisma migrate dev`
- You run `npm run dev` (to ensure types are up-to-date)

Manual regeneration (if needed):
```bash
npm run prisma:generate
```

## Backend Container

Start PostgreSQL and the backend container:

```bash
cd ..
docker compose -f docker-compose.dev.yml up --build
```

Default port: `127.0.0.1:4000`

**Note:** When using the containerized dev setup, apply migrations from your host machine:

```bash
cd backend
npm run prisma:migrate:dev
```

The container will automatically regenerate the Prisma client and reload the server.

Run the backend container from the full-stack compose file:

```bash
cd ..
docker compose up --build backend
```

[`Dockerfile`](Dockerfile) can be built and deployed independently from the frontend and database.

## Scripts

The project uses Prisma for database schema/migrations. The important scripts in `backend/package.json` are:

- `npm run dev` — start in development with `ts-node-dev` (respawn, transpile-only)
- `npm run build` — build/compile (uses `tsgo -b`)
- `npm run serve` — run the compiled output (`build/index.js`)
- `npm run start` — builds then serves the app
- `npm run lint` / `npm run lint:fix` — run ESLint / auto-fix
- `npm run format` / `npm run format:fix` — check or fix formatting with Prettier
- `npm run test` / `npm run test:watch` / `npm run test:coverage` — run Jest tests and coverage
- `npm run typecheck` — run `tsgo --noEmit` type checking
- `npm run check` — runs Prisma format/validate, lint, typecheck, and tests

Prisma-related scripts (database):

- `npm run prisma:generate` — generate Prisma client
- `npm run prisma:migrate:dev` — run `prisma migrate dev` (after format/validate)
- `npm run prisma:migrate:deploy` — run `prisma migrate deploy`
- `npm run prisma:migrate:reset` — run `prisma migrate reset`
- `npm run prisma:validate` — run `prisma validate`
- `npm run prisma:format` — format Prisma schema
- `npm run prisma:studio` — open Prisma Studio (web UI)
- `npm run prisma:seed` — run `prisma db seed`
- `npm run db:deploy` — deploy migrations and seed (runs migrate:deploy && prisma:seed)

- `npm run prepare` — install Husky git hooks

Note: the repository previously referenced Kysely/node-pg-migrate in docs; the current implementation uses Prisma (see `prisma/` and `@prisma/client` in `package.json`).
