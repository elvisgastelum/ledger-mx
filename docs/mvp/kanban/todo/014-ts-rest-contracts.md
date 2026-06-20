# Story: Adopt ts-rest API Contracts

**Status**: Todo
**Priority**: P1
**Estimated**: 1-2 days

## Goal

Adopt ts-rest as the canonical API contract layer for LedgerMx MVP, replacing class-validator DTOs and manual OpenAPI decorators.

## Context

ts-rest provides type-safe, contract-first API definitions shared between `apps/api` and `apps/web`. Contracts live in `libs/contracts`, with OpenAPI generated from contracts instead of NestJS Swagger decorators. This aligns with Clean Architecture rules by keeping ts-rest as an outer transport boundary, not imported in core domain/application layers.

## Acceptance Criteria

- [ ] `libs/contracts` package initialized with `@ts-rest/core` and Zod dependencies
- [ ] Stack documentation updated to reference ts-rest as API contract layer
- [ ] Workspace dependency rules updated to restrict contracts imports to apps only
- [ ] API boundaries doc updated to contract-first guidance
- [ ] Auth router contract defined in `libs/contracts/auth`
- [ ] OpenAPI generation from ts-rest contracts documented
- [ ] Clean Architecture rules updated to forbid domain/application imports of contracts

## Technical Notes

- Use `initContract()` and `c.router()` to define contracts
- All contracts must use `pathPrefix: '/api/v1'` for versioning
- Zod schemas must enforce `amountCents` (integer money), UUID v4 IDs, user-scoped routes
- `@ts-rest/open-api` `generateOpenApi()` for OpenAPI generation
- `@ts-rest/nest` for backend implementation, `@ts-rest/react-query/v5` for frontend

## Tests Required

- Validate contract schemas enforce money/id/user-scope conventions
- Verify OpenAPI generated from contracts matches expected endpoints

## Dependencies

- 003-api-model.md
- 011-architecture-foundations.md

## Done Checklist

- [ ] All acceptance criteria met
- [ ] Documentation updates complete
- [ ] No core domain/application layers import ts-rest or contracts
