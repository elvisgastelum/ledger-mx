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
│   ├── contracts/    # OpenAPI, shared types
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

### libs/database

Drizzle ORM schemas, migrations, repository implementations.

## pnpm Configuration

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'libs/*'
```

## Dependency Flow

- libs/domain: no deps
- libs/application: depends on domain
- libs/database: depends on domain, contracts
- apps/api: depends on all libs except ui
- apps/web: depends on all libs except api-specific
