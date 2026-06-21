# Story: API Model

**Status**: Done
**Priority**: P0
**Estimated**: 4 days
**Completed**: ~3 days (contract updated with auth schema alignment, OpenAPI generation implemented)

## Goal

Design API boundaries and OpenAPI specification.

## Context

- [x] Create `api/boundaries.md` with endpoint list (updated to align with ts-rest contract)
- [x] Create `api/openapi.md` with OpenAPI spec location (updated to document generation source)
- [x] Create `api/reports.md` with report endpoints (updated to align with contract, marked as planned)
- [x] Create `api/export.md` with export endpoints (updated to align with contract, marked as planned)
- [x] Create `api/health.md` with health check (updated to K8s standards, marked as planned)
- [x] Add ts-rest contract as single source of truth in `libs/contracts/src/contract.ts`
- [x] Add common/reusable Zod schemas to `libs/contracts/src/common.schemas.ts`
- [x] Auth controller imports validation schemas from `@ledger-mx/contracts` to avoid duplication
- [x] Generate OpenAPI document from ts-rest contract using `@ts-rest/open-api`

## Acceptance Criteria

- [x] API boundaries document all ts-rest contract-defined endpoints (implemented and planned)
- [x] OpenAPI spec generated from ts-rest contracts (`libs/contracts/src/openapi.ts` exports `openApiDocument`, artifact at `docs/mvp/api/openapi.json`)
- [x] ts-rest contracts define all endpoint methods, paths, schemas, and responses (auth, category groups, onboarding implemented with schemas aligned to controllers; reports/export/health planned)
- [x] Reports: spendable balance, expenses by category, debt progress (defined in contract, marked as planned)
- [x] Export: CSV download (ZIP post-MVP) (defined in contract with `c.otherResponse` for CSV, marked as planned)
- [x] Health: readiness and liveness probes (defined in contract as separate endpoints, marked as planned)

## Technical Notes

- API contracts use ts-rest in `libs/contracts` as single source of truth
- OpenAPI spec generation is **implemented** using `@ts-rest/open-api` (dependency installed); no manual Swagger decorators are used
- Generated OpenAPI document available at `libs/contracts/src/openapi.ts` (exported as `openApiDocument`)
- Static OpenAPI JSON artifact checked in at `docs/mvp/api/openapi.json`
- Regeneration script available via `pnpm generate:openapi` in `libs/contracts`
- Current backend controllers use NestJS `ZodValidationPipe` ( `@ts-rest/nest` is not yet installed); auth controller now imports validation schemas directly from `@ledger-mx/contracts` to avoid duplication, ensuring alignment with contract definitions
- All contracts include metadata (`implemented`, `auth`, `planned`) to distinguish deployed and planned endpoints
- User scoping is enforced via `user_id` in controllers (not required in contract paths/query params)
- Auth contracts updated to match controller implementation: register/login include optional displayName, deviceName, rememberMe; refresh/logout accept optional refreshToken in body (cookie primary); success response excludes refreshToken (httpOnly cookie only) and includes sessionId

## Tests Required

- [x] Compile-time validation of ts-rest contract (run `npx tsc --noEmit` in `libs/contracts`)
- [x] Validate contract aligns with actual implemented routes (auth, category groups, onboarding)
- [x] Validate OpenAPI spec once generation is set up (verification passed: `pnpm --filter @ledger-mx/contracts generate:openapi`, `pnpm --filter @ledger-mx/contracts typecheck`, `pnpm --filter @ledger-mx/api typecheck`, `pnpm typecheck`)

## Dependencies

- 011-architecture-foundations.md
- 001-database-model.md
- 004-auth-session-model.md (for auth schema alignment with actual auth routes)

## Done Checklist

- [x] All acceptance criteria met (OpenAPI generation implemented, TypeScript typecheck verified)
- [x] API documentation complete and aligned with contract
- [x] ts-rest contract compiles without TypeScript errors (verified via `pnpm typecheck` and `pnpm --filter @ledger-mx/contracts typecheck`)
