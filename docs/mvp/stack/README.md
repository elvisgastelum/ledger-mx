# Stack Documentation

Technology stack decisions for LedgerMx MVP.

## Files

- [Monorepo](./monorepo.md) - pnpm workspaces setup
- [Frontend](./frontend.md) - React, Vite, PWA, TanStack
- [Backend](./backend.md) - NestJS, PostgreSQL, Drizzle
- [Local Data Decision](./local-data-decision.md) - PGlite/IndexedDB choice

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

### Backend (apps/api)
- NestJS (framework)
- PostgreSQL (database)
- Drizzle ORM (type-safe queries)
- Electric (sync server)
- Passport/JWT (authentication)
- OpenAPI/Swagger (API docs)
- Class Validator (DTO validation)

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

## Versions (MVP)

```
React: ^18.3
Vite: ^5.0
NestJS: ^10.0
PostgreSQL: ^16.0
Drizzle: ^0.30
TanStack Query: ^5.0
TanStack Router: ^1.0
TanStack DB: ^0.1 (alpha)
PGlite: ^0.1
Electric: ^0.8 (alpha)
Tailwind: ^3.4
Vitest: ^1.0
Playwright: ^1.40
```

## Alpha Dependency Risk Mitigation

TanStack DB (^0.1) and Electric (^0.8) are alpha-stage. Mitigation strategy:

### Strict Pinning

```json
// pnpm-lock.yaml ensures exact versions
// package.json uses ~ not ^ for alpha deps
"dependencies": {
  "@tanstack/db": "~0.1.2",  // Exact minor, allow patches
  "electric-sql": "~0.8.4"
}
```

### Release Monitoring

- Subscribe to GitHub releases for both projects
- Weekly check for breaking changes / migration guides
- Test updates in feature branch before merging

### Adapter Abstraction

Wrap alpha APIs in internal adapters to limit blast radius:

```typescript
// libs/sync/adapters/electric.adapter.ts
export interface SyncAdapter {
  connect(url: string): Promise<void>;
  sync(shape: Shape): Promise<Subscription>;
  // ... stable interface
}

// Implementation can be swapped if needed
export class ElectricAdapter implements SyncAdapter { ... }
```

### Rollback Plan

1. **Freeze**: Pin to last working version in lockfile
2. **Patch**: Apply minimal fixes locally if needed (fork as last resort)
3. **Swap**: Replace adapter implementation (see abstraction above)
4. **Communication**: Document breaking changes in CHANGELOG

### Testing

- Integration tests MUST cover sync flows (catch regressions early)
- Snapshot tests for sync state shape
- E2E tests for offline→online sync scenarios

## Future Considerations

- Upgrade TanStack DB when stable
- Evaluate Electric production readiness
- Consider SQLite WASM/OPFS after PGlite proven
- Add passkey auth (WebAuthn)
- Native mobile apps (React Native?)
