# Task Assignment API Web

This directory contains the frontend web application for the Task Assignment system.

## Tech Stack

- React
- TypeScript
- Vite
- TanStack Router
- TanStack Query
- Ant Design

## Directory Structure

```text
frontend/
├── src/
│   ├── app/
│   ├── assets/
│   ├── components/
│   ├── features/
│   ├── lib/
│   ├── routes/
│   ├── test/
│   ├── main.tsx
│   └── routeTree.gen.ts
├── eslint.config.js
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Setup

Install root dependencies first, then install frontend dependencies.

Root:

```bash
cd ..
npm install
```

Frontend:

```bash
npm install
```

Environment: copy `.env.example` to `.env` and set any required variables for API host or feature flags.

## Local Development

1. Start PostgreSQL from the repository root:

```bash
cd ..
docker compose -f docker-compose.dev.yml up db
```

2. Start the backend dev server:

```bash
cd backend
npm install
npm run dev
```

3. Start the frontend dev server:

```bash
npm run dev
```

Default ports:

- frontend dev server: `127.0.0.1:3000` (the `dev` script runs `vite dev --port 3000`)
- backend dev server: `127.0.0.1:4000`
- PostgreSQL: `127.0.0.1:5432`

Preview: `npm run preview` uses Vite's preview server (default port `5173` unless overridden).

## Full Containerized Application

Run the complete containerized stack from the repository root:

```bash
cd ..
docker compose up --build
```

The frontend container serves the built application with Nginx (container listens on port `80`; compose maps it to host `8080`).

Default ports:

- frontend: `127.0.0.1:8080`
- backend: `127.0.0.1:4000`
- PostgreSQL: `127.0.0.1:5432`

## Container

[`Dockerfile`](Dockerfile) builds the production frontend container (served by Nginx in the container on port `80`).

## Scripts

The following scripts are available in `frontend/package.json`:

- `npm run dev` — start the Vite development server on port `3000` (`vite dev --port 3000`)
- `npm run build` — build the frontend for production (`vite build`)
- `npm run preview` — preview the production build locally (`vite preview`, default port `5173`)
- `npm run test` / `npm run test:watch` / `npm run test:ci` / `npm run test:coverage` — run Vitest tests and coverage
- `npm run lint` / `npm run lint:fix` — run ESLint / auto-fix
- `npm run lint:css` / `npm run lint:css:fix` — run Stylelint / auto-fix CSS
- `npm run typecheck` — run `tsgo -b --pretty --noEmit` (type checking)
- `npm run format` / `npm run format:check` — Prettier
- `npm run prepare` — install Husky hooks

Notes:

- The `package.json` is configured with `type: "module"` and an `imports` map (`#/*` -> `./src/*`) to support absolute-ish imports in the codebase.
- `lint-staged` is configured to run formatting and lint fixes on staged files (see `package.json`).
