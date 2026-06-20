# Story: API Model

**Status**: Todo
**Priority**: P0
**Estimated**: 4 days

## Goal

Design API boundaries and OpenAPI specification.

## Context

- Create `api/boundaries.md` with endpoint list
- Create `api/openapi.md` with OpenAPI spec location
- Create `api/reports.md` with report endpoints
- Create `api/export.md` with export endpoints
- Create `api/health.md` with health check

## Acceptance Criteria

- [ ] API boundaries document all ts-rest contract-defined endpoints
- [ ] OpenAPI spec generated from ts-rest contracts
- [ ] ts-rest contracts define all endpoint methods, paths, schemas, and responses
- [ ] Reports: spendable balance, expenses by category, debt progress
- [ ] Export: CSV download (ZIP post-MVP)
- [ ] Health: readiness and liveness probes

## Technical Notes

- API contracts use ts-rest in `libs/contracts` as single source of truth
- OpenAPI spec generated from ts-rest contracts using `@ts-rest/open-api`, not NestJS Swagger decorators
- Backend controllers implement contracts using `@ts-rest/nest`
- Frontend consumes contracts using `@ts-rest/react-query/v5`
- All endpoints require JWT auth except login/register

## Tests Required

- Test all API endpoints
- Validate OpenAPI spec
- Test auth on protected endpoints

## Dependencies

- 011-architecture-foundations.md
- 001-database-model.md
- 004-auth-session-model.md

## Done Checklist

- [ ] All acceptance criteria met
- [ ] API documentation complete
