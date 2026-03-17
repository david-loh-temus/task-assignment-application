# Task Assignment

This repository contains the source code and supporting documents for the Task Assignment application.

The repository is split into two applications:

- `frontend/`: React + TypeScript web application
- `backend/`: Express + TypeScript API service

## Repository Layout

```text
.
├── backend/
├── frontend/
├── architecture.md
└── Software Engineering Take Home Test v2.0.pdf
```

## Intended Stack

- Frontend: React, TypeScript, TanStack Router, TanStack Query, Ant Design, React Hook Form, Zod
- Backend: Express, TypeScript, Kysely, node-pg-migrate, pg, PostgreSQL, Pino

## Getting Started

Install root dependencies first, then install app dependencies.

Root:

```bash
npm install
```

Then install dependencies and run each application from its own directory.

Backend:

```bash
cd backend
npm install
```

Frontend:

```bash
cd frontend
npm install
```

Detailed setup and script references are documented in:

- [backend/README.md](backend/README.md)
- [frontend/README.md](frontend/README.md)
