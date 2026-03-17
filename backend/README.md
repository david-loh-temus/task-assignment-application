# Task Assignment API Service

This directory contains the backend API service for the Task Assignment application.

## Tech Stack

- Node.js
- TypeScript
- Express
- Kysely
- node-pg-migrate
- pg
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

`npm install` runs the `prepare` script, which executes `husky install` so the repository-level Git hooks are registered automatically.

## Scripts

The following scripts are available in `backend/package.json`:

- `npm run dev`: start the backend in development mode with `ts-node-dev`
- `npm run build`: compile TypeScript into `build/`
- `npm run serve`: run the compiled backend from `build/index.js`
- `npm run start`: build and then serve the backend
- `npm run lint`: run ESLint on backend TypeScript source files
- `npm run lint:fix`: run ESLint and apply fixable changes
- `npm run typecheck`: run TypeScript type-checking without emitting files
- `npm run format`: check formatting with Prettier
- `npm run format:fix`: write formatting changes with Prettier
- `npm run test`: run Jest tests in CI-style mode
- `npm run test:watch`: run Jest in watch mode
- `npm run test:coverage`: run Jest coverage output
- `npm run migration:up`: apply database migrations
- `npm run migration:down`: roll back database migrations
- `npm run migration:create`: create a new migration file
- `npm run seed:create`: create a new seed file
- `npm run seed:run`: run seed files
- `npm run seed:down`: roll back seed files
- `npm run prepare`: install Husky hooks
