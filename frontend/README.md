# Task Assignment API Web

This directory contains the frontend web application for the Task Assignment system.

## Tech Stack

- React
- TypeScript
- Vite
- TanStack Router
- TanStack Query
- Ant Design
- React Hook Form
- Zod

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

Installing dependencies runs `husky install` as part of the `prepare` script, so the shared Git hooks are configured automatically.

## Scripts

The following scripts are available in `frontend/package.json`:

- `npm run dev`: start the Vite development server on port `3000`
- `npm run build`: build the frontend for production
- `npm run preview`: preview the production build locally
- `npm run lint`: run ESLint on frontend source files
- `npm run lint:fix`: run ESLint and apply fixable changes
- `npm run lint:css`: run Stylelint on CSS/SCSS files
- `npm run lint:css:fix`: run Stylelint and apply fixable CSS changes
- `npm run typecheck`: run TypeScript type-checking without emitting files
- `npm run format`: write formatting changes with Prettier
- `npm run format:check`: check formatting with Prettier
- `npm run test`: run Vitest
- `npm run test:watch`: run Vitest in watch mode
- `npm run test:ci`: run Vitest once for CI-style usage
- `npm run test:coverage`: run Vitest with coverage output
- `npm run prepare`: install Husky hooks
