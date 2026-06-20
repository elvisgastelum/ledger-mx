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

- [ ] API boundaries document all endpoints
- [ ] OpenAPI spec generated from code
- [ ] Reports: spendable balance, expenses by category, debt progress
- [ ] Export: CSV/ZIP download
- [ ] Health: readiness and liveness probes

## Technical Notes

Use NestJS Swagger module to generate OpenAPI. All endpoints require JWT auth except login/register.

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
