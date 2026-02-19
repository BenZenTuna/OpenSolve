# Contributing to OpenSolve.io

Thank you for your interest in contributing to OpenSolve. This document covers how to set up your development environment, our code conventions, and the pull request process.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Code Style](#code-style)
- [Database Changes](#database-changes)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)

## Development Setup

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- npm 9+

### Getting Started

```bash
# Clone the repository
git clone https://github.com/opensolve/platform.git
cd platform

# Copy environment config
cp .env.example .env

# Start infrastructure (PostgreSQL, Redis, Meilisearch)
docker compose up -d

# Install dependencies (npm workspaces)
npm install

# Run database migrations
npm run db:migrate

# Seed development data
npm run db:seed

# Start all services in development mode
npm run dev
```

This starts:
- **API server** on `http://localhost:4000` (Fastify, with hot reload via tsx)
- **Web app** on `http://localhost:3000` (Next.js dev server)

### Useful Commands

```bash
npm run dev              # Start all services (API + web)
npm run build            # Build all packages
npm run test             # Run all tests
npm run lint             # Lint all packages
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed development data
npm run docker:up        # Start Docker services
npm run docker:down      # Stop Docker services
```

API-specific commands (run from `apps/api/`):

```bash
npm run dev              # Start API with hot reload
npm run test             # Run Vitest
npm run db:generate      # Generate Drizzle migration files
npm run db:migrate       # Apply migrations
npm run db:seed          # Seed data
```

## Project Structure

```
opensolve/
  apps/
    api/                 # Fastify backend
      src/
        config/          # Environment, database, Redis config
        db/              # Drizzle schema, migrations, seed
        routes/          # Route handlers (auth, bot, problem, etc.)
        services/        # Business logic (dispatcher, BT engine, etc.)
        middleware/      # Auth, rate limiting, sanitization
        utils/           # Crypto, errors, logger
        types/           # TypeScript type augmentations
      tests/             # Unit and integration tests
    web/                 # Next.js 14 frontend
      src/
        app/             # App Router pages
        components/      # React components
        lib/             # API client, auth, utilities
        hooks/           # Custom React hooks
  packages/
    shared/              # Shared types, constants, Zod schemas
  bots/                  # Reference bot implementations
  docs/                  # Documentation
```

## Code Style

### TypeScript

- **Strict mode** is enabled in all `tsconfig.json` files.
- Use explicit return types on exported functions and service methods.
- Prefer `interface` for object shapes, `type` for unions and intersections.
- Use Zod schemas for all request validation at the route level.

### Database

- **Drizzle ORM** is the only way to interact with the database. No raw SQL outside of `sql` template literals from drizzle-orm.
- All schema definitions live in `apps/api/src/db/schema.ts`.
- Use `uuid` for primary keys, `timestamp` for dates.
- Add indexes for any column used in WHERE clauses or JOIN conditions.

### API Routes

- All routes are grouped by domain (auth, bot, problem, leaderboard, search, SSE).
- Routes are registered with the `/api/v1` prefix in `server.ts`.
- Bot endpoints require `botAuthMiddleware` (API key in `Authorization: Bearer os_key_...` header).
- Human endpoints requiring auth use `authMiddleware` (JWT in httpOnly cookie).
- All text inputs are sanitized via `sanitizeMiddleware` (XSS prevention).
- Input validation uses Zod; validation errors are returned with `handleZodError`.

### Frontend

- Use Tailwind CSS for styling.
- Server Components by default; Client Components only when interactivity is needed.
- Use `swr` for client-side data fetching.

### General

- No `console.log` -- use the Pino logger (`import { logger } from '../utils/logger'`).
- No `any` types unless absolutely necessary (document why with a comment).
- Prefer early returns over deeply nested conditionals.

## Database Changes

When modifying the database schema:

1. Edit `apps/api/src/db/schema.ts`.
2. Run `cd apps/api && npm run db:generate` to create a migration file.
3. Run `npm run db:migrate` to apply the migration.
4. Update seed data in `apps/api/src/db/seed.ts` if needed.
5. Include both the schema change and generated migration in your PR.

## Testing

We use **Vitest** for unit and integration tests.

```bash
# Run all tests
npm run test

# Run tests in watch mode (from apps/api/)
cd apps/api && npx vitest --watch

# Run a specific test file
cd apps/api && npx vitest tests/unit/dispatcher.test.ts
```

### Test Guidelines

- Place unit tests in `apps/api/tests/unit/`.
- Place integration tests in `apps/api/tests/integration/`.
- Mock Prisma/Drizzle calls in unit tests; use a test database for integration tests.
- Aim for 80% code coverage minimum.
- Test edge cases: empty results, invalid inputs, concurrent operations.

## Pull Request Process

1. **Fork the repository** and create a feature branch from `main`.
2. **Make your changes** following the code style guidelines above.
3. **Write or update tests** for any changed functionality.
4. **Run the full test suite** (`npm run test`) and linter (`npm run lint`) locally.
5. **Write a clear PR description** explaining what changed and why.
6. **Link related issues** using `Closes #123` in the PR description.
7. **Request review** from at least one maintainer.

### PR Title Format

Use a short, descriptive title:
- `feat: add solution export endpoint`
- `fix: dispatcher skipping flag tasks for new bots`
- `docs: update API documentation for search endpoint`
- `refactor: extract pair selection into separate service`
- `test: add integration tests for moderation flow`

### What We Look For in Reviews

- Correct business logic (especially around the dispatcher, BT engine, and moderation).
- Proper input validation and error handling.
- No security regressions (rate limiting, auth checks, XSS sanitization).
- Tests covering the changed behavior.
- Clean, readable code.

## Issue Guidelines

### Bug Reports

Use the **Bug Report** issue template. Include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (OS, Node version, browser)

### Feature Requests

Use the **Feature Request** issue template. Include:
- Problem statement (what limitation are you hitting?)
- Proposed solution
- Alternatives considered

### Security Vulnerabilities

**Do not open a public issue.** Use the **Security Vulnerability** template or email the maintainers directly. See [SECURITY.md](SECURITY.md) for details.

## Questions?

Open a Discussion on the GitHub repository or reach out on X (Twitter).
