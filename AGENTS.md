# Project Instructions for Agents

## MVP Implementation

- Read relevant `docs/mvp/` docs before implementing MVP stories/features.
- `docs/mvp/stack/versions.md` has stale framework versions; trust `package.json` and scripts when conflicting.

## Monorepo Commands

Key pnpm commands: `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm test:web`, `pnpm test:e2e`.
`db:up` requires `.env` (copy from `.env.example` first; docker-compose.dev.yml requires POSTGRES_DB/USER/PASSWORD/PORT).
Web-focused: `pnpm --filter @ledger-mx/web dev`, `pnpm --filter @ledger-mx/web typecheck`, `pnpm --filter @ledger-mx/web test`.

## Workspace Structure

`apps/web` (React SPA), `apps/api` (NestJS), `packages/domain/application/contracts/infra` (shared libs), `docs/mvp`.

## Architecture Boundaries

Web/API → application → domain. Domain and application must NOT import contracts or ts-rest; contracts are API boundary only.

## API Patterns

ts-rest + Zod; routes under `/api/v1`. Use Zod/nestjs-zod, NOT class-validator/Joi. All routes user-scoped.

## Security & Data Isolation

Every financial query/table MUST be scoped by `user_id`. Test cross-user isolation.

## Financial Invariants

- Integer cents only, NO floats
- UUID v4 client-generated IDs
- Transaction lines must sum to zero
- NO hard deletes for financial records after sync/cleared; use reversal/correction
- UTC timestamps internally

## Frontend: React Hook Form (Mandatory for apps/web Forms)

**Always use react-hook-form** for client React forms in `apps/web/src`.

Required: `useForm` with typed interface, `register`, `handleSubmit`, `formState` for errors/isSubmitting.
**NO**: `useState` for form fields, `FormEvent` handling, separate form state management.
**Allowed useState**: wizard steps, modal toggles, non-form UI state only.

TanStack Router/Query patterns. Use `credentials: 'include'` for authenticated fetches (match existing pattern).

## Testing

- Root Vitest: node environment
- Web Vitest: jsdom via `pnpm test:web`
- DB integration: Testcontainers
- Add tests for money/user-scope/double-entry/UUID invariants when touching related code
