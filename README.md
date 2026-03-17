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

## Containerized Workflows

Files:

- `docker-compose.yml`: full containerized stack
- `docker-compose.dev.yml`: PostgreSQL and optional backend container for local development

### Full Containerized Application

1. Copy the example environment file at the repository root.

```bash
cp .env.example .env
```

2. Start the application:

```bash
docker compose up --build
```

This starts:

- PostgreSQL on `127.0.0.1:5432`
- Backend API on `127.0.0.1:4000`
- Frontend on `127.0.0.1:8080`

Endpoints:

- Frontend: `http://127.0.0.1:8080`
- Backend health: `http://127.0.0.1:4000/health`

### Local Development

1. Start PostgreSQL:

```bash
docker compose -f docker-compose.dev.yml up db
```

2. Start the backend dev server:

```bash
cd backend
npm install
npm run dev
```

3. Start the frontend dev server in a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Endpoints:

- Frontend: `http://127.0.0.1:3000`
- Backend health: `http://127.0.0.1:4000/health`
- PostgreSQL: `127.0.0.1:5432`

### Optional Backend-In-Container Development

```bash
docker compose -f docker-compose.dev.yml up --build
```

### Deployment

- [`backend/Dockerfile`](backend/Dockerfile) can be built and deployed as an API service
- [`frontend/Dockerfile`](frontend/Dockerfile) can be built and deployed as a static frontend container
- PostgreSQL can be run locally in Docker and replaced with a managed database in the cloud

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
