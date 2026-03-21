# Task Assignment

A full-stack task management application built for the **Software Engineering Take Home Test v2.0**.

The system allows users to:
- create tasks and subtasks
- assign developers based on required skills
- update task status and assignee
- automatically identify skills with an LLM when skills are omitted during task creation

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

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- TanStack Router
- TanStack Query
- Ant Design
- Tailwind CSS
- Vitest + jest-dom

### Backend
- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Zod
- Pino
- Jest
- `@google/genai` (Gemini SDK)

## Architecture Overview

### Backend structure
The backend follows a simple **route → controller → service** structure.

- **Routes** define endpoints and Swagger/OpenAPI documentation.
- **Controllers** read request parameters and payloads, perform request validation via Zod schemas, orchestrate service calls, and return API responses.
- **Services** contain business logic, cross-service orchestration, and database access via Prisma.

This structure was chosen to keep responsibilities separated without overengineering a relatively small take-home project.

### Frontend structure
The frontend uses a **feature-based structure** alongside **shared components**.

- Feature folders group page-specific UI and logic.
- Shared components hold reusable UI elements used across screens.
- TanStack Router is used for file-based routing.
- TanStack Query is used for server-state caching and mutations.
- Route loaders are used together with Suspense and queries for page-level data preloading.

No additional global state library was introduced because the application scope is small and server state is the main concern.

## Key Design Decisions

### 1. Prisma for schema management and seed data
Prisma was chosen to keep the database schema, migrations, generated client, and seed flow in code. For a take-home project, it provides a fast and maintainable way to evolve the schema while keeping local setup straightforward.

### 2. Zod for validation
Zod is used in the controller layer for request validation. It was chosen because it is a type-first library and works well in a TypeScript codebase.

### 3. Structured logging with Pino
Pino is used instead of raw `console` logging so the backend has structured application logs. There was no strict dependency on Pino specifically; the main goal was to avoid unstructured console logging in the API service.

### 4. Ant Design + Tailwind CSS
Ant Design was chosen for higher-level UI primitives such as layout scaffolding, forms, tables, and modal interactions. Tailwind CSS was used mainly for lightweight spacing and layout adjustments to avoid writing unnecessary custom CSS for simple presentation needs.

### 5. LLM-powered skill identification
When a task is created without skills, the frontend omits the `skills` field and the backend triggers an LLM flow using Gemini via `@google/genai`.

The backend prompt is designed to:
- prioritize matching against existing skills already stored in the database
- generate a new skill only when no existing skill is a suitable fit
- allow both technical and non-technical skill labels where appropriate

Gemini was chosen because a free API option was explicitly acceptable for the take-home requirements.

### 6. Skill normalization
The `skills` table uses a unique constraint on `normalized_name` so semantically identical skills with casing differences, such as `Backend` and `backend`, are treated as the same skill. This helps keep LLM-generated output deterministic and prevents duplicate skills from being created unnecessarily.

## Domain Model Notes

### Tasks and subtasks
Tasks are modeled using a single entity. Subtasks reuse the same task model and are linked through `parentId`.

This design was chosen because the brief states that subtasks share the same properties as tasks. It avoids maintaining a separate subtask model while still supporting nested task hierarchies.

### Subtask depth
The implementation supports nested subtasks up to a maximum depth of **3**. This keeps the recursive logic and UI handling simple while still satisfying the intended hierarchy use case.

### Status rules
Supported task statuses are:
- `TODO`
- `IN-PROGRESS`
- `DONE`

Parent tasks can only be marked as `DONE` when all of their subtasks are already `DONE`.

Subtasks otherwise manage their own status independently because no additional parent-child status propagation rules were required by the brief.

### Assignment rules
A task can only be assigned to a developer who has all required skills.

This rule is enforced in both layers:
- **frontend**: all developers are shown in the selector, but incompatible developers are disabled in the UI
- **backend**: the assignment is validated again so the business rule is enforced server-side

## API Notes

### API style
The API is documented with Swagger and exposed from the backend server at:

- `http://127.0.0.1:4000/api-docs`

API handlers return standardized success and error responses through shared utility helpers.

### Task and subtask creation flow
Tasks and subtasks are created **one at a time**.

- Top-level tasks are created normally.
- Subtasks are created through the same API by supplying a `parentId`.
- Tasks returned by the list endpoint include nested subtasks in the parent JSON response.

The nested response shape was chosen because the current UI displays subtasks through expandable table rows and the dataset is small enough that a single aggregated response is acceptable.

## Frontend Screens

The implemented UI covers the main flows required by the brief:
- **Task list**: view tasks and subtasks, update status, and change assignee
- **Create task**: create a new top-level task
- **Create subtask**: create a child task from the task list via modal

## Containerization

The project is containerized with Docker and can be run with Docker Compose.

Files:
- `docker-compose.yml`: full application stack
- `docker-compose.dev.yml`: PostgreSQL and optional backend container for development

### Environment management
Environment variables are not hardcoded in Docker images. Runtime configuration is supplied through `.env`.

### Prisma initialization
Prisma client generation must happen before migrations and seed execution. Because the production backend image excludes devDependencies, migrations are run through a dedicated one-shot Docker service before the full stack is started.

## Running the application with Docker Compose

From the repository root:

```bash
cp .env.example .env
docker compose up --build
```

This starts:
- PostgreSQL on `127.0.0.1:5432`
- Backend API on `127.0.0.1:4000`
- Frontend on `127.0.0.1:8080`

The `backend-migrate` service automatically runs migrations and seeds the database before the backend starts. No additional setup commands are needed.

Useful endpoints:
- Frontend: `http://127.0.0.1:8080`
- Backend health: `http://127.0.0.1:4000/health`
- Swagger: `http://127.0.0.1:4000/api-docs`

## Development Guide

### Host-based development (Recommended for active development)

Start the database:

```bash
docker compose -f docker-compose.dev.yml up -d db
```

Backend setup:

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate:dev
npm run dev
```

When you modify `prisma/schema.prisma`:
```bash
npm run prisma:migrate:dev --name your_migration_name
```

Frontend (in a new terminal):

```bash
cd frontend
npm install
npm run dev
```

### Containerized development (Using Docker)

```bash
docker compose -f docker-compose.dev.yml up --build
```

This starts:
- PostgreSQL on `127.0.0.1:5432`
- Backend on `127.0.0.1:4000` (auto-reloads on file changes via volume mount)
- Frontend is NOT included in dev compose (run separately or use production compose)

The backend container uses the `dev` target and includes Prisma CLI tools, so schema changes automatically trigger regeneration.

## Build and deployment notes

### Prisma in Production

The production backend image (`production` target) excludes devDependencies, including the Prisma CLI tools. This ensures smaller image sizes and faster deployments.

To handle database migrations in production, a dedicated one-shot service (`backend-migrate`) is included in `docker-compose.yml`:
- It uses the `dev` build target (which includes devDependencies)
- It runs before the main backend service
- It executes `prisma generate` (for TypeScript types) and `prisma migrate deploy` (for database schema)
- It then seeds the database with `prisma db seed`

### Starting the production stack

```bash
cp .env.example .env
docker compose up --build
```

Docker Compose automatically:
1. Builds the backend and frontend images
2. Starts PostgreSQL
3. Runs the `backend-migrate` service to apply migrations and seed data
4. Starts the backend and frontend services

If a CI/CD pipeline is introduced, follow this flow:
1. Build images: `docker compose build`
2. Push to registry (optional)
3. Run compose: `docker compose up` (migrations and seeding happen automatically via `backend-migrate`)

## Testing

The project includes unit testing only.

- **Backend**: Jest
- **Frontend**: Vitest with jest-dom

Testing was kept intentionally lightweight given the scope and timebox of the take-home.

## Scope trade-offs

- The solution supports task, subtask, and nested subtask creation, but uses a simpler modal-based subtask flow from the task list instead of dynamically rendering nested subtask inputs directly on the task creation page.
- Pagination and filtering were not implemented because the expected dataset and UI scope are small. Simple alphabetical ordering was sufficient for this implementation.
- No authentication or authorization layer was added because it was not part of the brief.
- No delete flow was implemented because deletion was not required by the brief.
- No background jobs or websockets were introduced because the LLM-based skill generation was acceptable as a synchronous request in this project.

## Additional notes

- Seed data is included to support the brief requirements and local testing.
- The initial seeded skill set includes `Frontend` and `Backend`, but the LLM flow is intentionally not restricted to technical skills only.
- `architecture.md` contains the initial high-level thought process captured before implementation.

## Getting Started

Install dependencies per application as needed.

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

Additional details can be documented further in:
- `backend/README.md`
- `frontend/README.md`
