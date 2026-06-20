# Monorepo Workspaces

## Structure

```
ledger-mx/
├── apps/
│   ├── api/          # NestJS backend
│   └── web/          # React PWA frontend
├── libs/
│   ├── domain/       # Entities, value objects, rules
│   ├── application/  # Use cases, services
│   ├── database/     # Drizzle schemas, migrations
│   ├── contracts/    # ts-rest API contracts, Zod schemas
│   ├── sync/         # Electric client, shapes
│   ├── ui/           # Shared UI components
│   └── testing/      # Test utilities, fixtures
└── pnpm-workspace.yaml
```

## Workspace Details

### apps/api

NestJS, PostgreSQL, Drizzle, Electric, JWT auth

### apps/web

React + Vite, PWA, TanStack, PGlite, Tailwind + shadcn/ui

### libs/domain

Framework agnostic. Entities, Value Objects, Repository Interfaces, Business Rules.

### libs/application

Use Cases, Application Services, DTOs. Depends on domain only.

### libs/contracts

Canonical ts-rest API boundary package. Responsibilities: ts-rest routers, Zod schemas, shared API errors, OpenAPI generation helpers, exported contract types. Non-responsibilities: domain behavior, application use cases, Drizzle schemas, Nest controllers, React components. Depends on `@ts-rest/core` and Zod only. `libs/domain` and `libs/application` must not import `libs/contracts`.

### libs/database

Drizzle ORM schemas, migrations, repository implementations.

## pnpm Configuration

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "libs/*"
```

## Dependency Flow

- libs/domain: no deps
- libs/application: depends on domain only (must not import contracts)
- libs/contracts: depends on `@ts-rest/core`, Zod
- libs/database: depends on domain only
- apps/api: depends on all libs except ui (including contracts)
- apps/web: depends on all libs except api-specific (including contracts)
