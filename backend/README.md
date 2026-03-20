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

## Backend Container

Start PostgreSQL and the backend container:

```bash
cd ..
docker compose -f docker-compose.dev.yml up --build
```

Default port: `127.0.0.1:4000`

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
