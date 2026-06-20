# Stack Documentation

Technology stack decisions for LedgerMx MVP.

## Files

- [Monorepo](./monorepo.md) - pnpm workspaces setup
- [Frontend](./frontend.md) - React, Vite, PWA, TanStack
- [Backend](./backend.md) - NestJS, PostgreSQL, Drizzle
- [Local Data Decision](./local-data-decision.md) - PGlite/IndexedDB choice
- [Versions](./versions.md) - Exact dependency versions
- [Alpha Dependencies](./alpha-dependencies.md) - Risk mitigation for alpha-stage deps

## Technology Stack

### Frontend (apps/web)

- React 18+
- Vite (build tool)
- TypeScript
- PWA (service worker, offline)
- TanStack Router (type-safe routing)
- TanStack Query (data fetching/caching)
- TanStack DB (local + sync state)
- PGlite/IndexedDB (local SQL)
- Electric (sync client)
- Tailwind CSS
- shadcn/ui (component library)
- @ts-rest/react-query/v5 (type-safe API client, integrates with TanStack Query)

### Backend (apps/api)

- NestJS (framework)
- PostgreSQL (database)
- Drizzle ORM (type-safe queries)
- Electric (sync server)
- Passport/JWT (authentication)
- ts-rest (API contracts in `libs/contracts`)
- OpenAPI/Swagger (generated from ts-rest contracts)
- Zod (request/response schema validation)
- @ts-rest/nest (contract implementation)

### Testing

- Vitest (unit/integration tests)
- Testing Library (React components)
- Playwright (E2E tests)
- Supertest (API tests)
- Testcontainers (PostgreSQL in tests)

### Monorepo

- pnpm workspaces
- TypeScript project references
- Shared configs (ESLint, Prettier, tsconfig)

## Key Decisions

1. **Local SQL**: PGlite/IndexedDB (not SQLite WASM/OPFS)
2. **Sync**: Electric + TanStack DB Shape API
3. **State**: TanStack Query + TanStack DB
4. **UI**: shadcn/ui (not custom design system)
5. **Testing**: Strict TDD with Testcontainers

> **Version pinning**: See [versions.md](./versions.md) for exact dependency versions.
> **Alpha dependencies**: See [alpha-dependencies.md](./alpha-dependencies.md) for TanStack DB and Electric risk mitigation.

## Future Considerations

- Upgrade TanStack DB when stable
- Evaluate Electric production readiness
- Consider SQLite WASM/OPFS after PGlite proven
- Add passkey auth (WebAuthn)
- Native mobile apps (React Native?)
