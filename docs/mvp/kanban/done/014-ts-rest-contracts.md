# Story: Adopt ts-rest API Contracts

**Status**: Done
**Priority**: P1
**Estimated**: 1-2 days
**Completed**: Completed

## Goal

Adopt ts-rest as the canonical API contract layer for LedgerMx MVP, replacing class-validator DTOs and manual OpenAPI decorators.

## Context

ts-rest provides type-safe, contract-first API definitions shared between `apps/api` and `apps/web`. Contracts live in `libs/contracts`, with OpenAPI generated from contracts instead of NestJS Swagger decorators. This aligns with Clean Architecture rules by keeping ts-rest as an outer transport boundary, not imported in core domain/application layers.

## Acceptance Criteria

- [x] `libs/contracts` package initialized with `@ts-rest/core` and Zod dependencies
- [x] Stack documentation updated to reference ts-rest as API contract layer
- [x] Workspace dependency rules updated to restrict contracts imports to apps only
- [x] API boundaries doc updated to contract-first guidance
- [x] Auth router contract defined in `libs/contracts/auth`
- [x] OpenAPI generation from ts-rest contracts documented
- [x] Clean Architecture rules updated to forbid domain/application imports of contracts

## Technical Notes

- Use `initContract()` and `c.router()` to define contracts
- All contracts use `/api/v1` prefix for versioning (consistent with project requirements)
- Zod schemas enforce `amountCents` (integer money), UUID v4 IDs, user-scoped routes
- `@ts-rest/open-api` `generateOpenApi()` for OpenAPI generation
- `@ts-rest/nest` adoption is a follow-up (current implementation uses Zod schemas from contracts with NestJS ZodValidationPipe)
- Health endpoints moved to `/api/v1/health/*` for consistency
- Planned routers added for accounts, envelopes, and transactions (marked `implemented: false, planned: true` with 501 responses)

## Tests Required

- [x] Compile-time validation of ts-rest contract (run `npx tsc --noEmit` in `libs/contracts`)
- [x] Validate contract schemas enforce money/id/user-scope conventions
- [x] Verify OpenAPI generated from contracts matches expected endpoints
- [x] Runtime validation tests added: integer cents rejects floats, transaction lines sum to zero

## Dependencies

- 003-api-model.md
- 011-architecture-foundations.md

## Implementation Notes

### Already Implemented (Before This Story)
- `libs/contracts` package with `@ts-rest/core`, Zod, `@ts-rest/open-api`
- Auth, category groups, onboarding, export, reports, health contracts defined
- OpenAPI generation via `pnpm generate:openapi` in `libs/contracts`
- Auth and category-groups controllers using Zod schemas from contracts

### Newly Added (This Story)
- Updated auth paths from `/auth/*` to `/api/v1/auth/*`
- Updated category-groups paths from `/category-groups*` to `/api/v1/category-groups*`
- Updated health paths from `/health/*` to `/api/v1/health/*`
- Added planned routers/schemas for accounts, envelopes, and transactions
- Created schema files: `accounts/account.schemas.ts`, `envelopes/envelope.schemas.ts`, `transactions/transaction.schemas.ts`
- Updated API controllers to use `/api/v1/*` paths
- Updated API tests to reflect new paths
- Added ESLint `no-restricted-imports` rule to forbid contracts imports in domain/application
- Added runtime validation tests for schema enforcement

### Follow-up Items
- Consider adopting `@ts-rest/nest` for type-safe controller implementation
- Implement accounts, envelopes, and transactions API controllers
- Add web app fetches for new endpoints when implemented

## Done Checklist

- [x] All acceptance criteria met
- [x] Documentation updates complete
- [x] No core domain/application layers import ts-rest or contracts (enforced via ESLint)
- [x] All paths use `/api/v1` prefix consistently
- [x] Planned endpoints marked with `implemented: false, planned: true`
- [x] Runtime validation tests added for financial invariants
