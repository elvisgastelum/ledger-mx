# LedgerMx MVP Documentation

Offline-first personal finance app for irregular income and paycheck budgeting.

## Quick Links

- [Product](./product/) - Vision, scope, examples
- [Architecture](./architecture/) - Clean Architecture, workspaces
- [Stack](./stack/) - Technology decisions
- [Database](./database/) - Schema, rules, migrations
- [Sync](./sync/) - Electric + TanStack DB Shape API
- [API](./api/) - Boundaries, auth, OpenAPI
- [Web](./web/) - UX, flows, wireframes
- [Security](./security/) - Auth, sessions, isolation
- [Testing](./testing/) - TDD, invariants, coverage
- [Deployment](./deployment/) - Homelab, Docker, env
- [Export](./export/) - CSV audit export (ZIP post-MVP)
- [Seeds](./seeds/) - Demo and personal data
- [Kanban](./kanban/) - Implementation stories

## MVP Decisions

1. **Sync**: Electric + TanStack DB Shape API (first path)
2. **Local SQL**: PGlite/IndexedDB (SQLite WASM/OPFS deferred)
3. **Wireframes**: Parallel documentation-only planning

## Workspace Structure

```
apps/api          - NestJS + PostgreSQL + Drizzle
apps/web          - React + Vite + PWA + TanStack
libs/domain       - Entities, value objects, rules
libs/application  - Use cases, services
libs/database     - Drizzle schemas, migrations
libs/contracts    - OpenAPI, shared types
libs/sync         - Electric client, shapes
libs/ui           - shadcn/ui components
libs/testing      - Test utilities, fixtures
docs/mvp          - This documentation
```

## Core Financial Model

Real account balance
- Protected envelopes
- Upcoming required payments
= Real spendable balance

## Constraints

- Documentation: English only
- UI: English and Spanish supported (see product/locales.md)
- Markdown only
- Clean Architecture / Onion Architecture
- No floats: integer minor units (amount_cents)
- Client-generated UUID v4 for all entities
- Offline-first with sync later
- Soft delete / reversal for corrections
