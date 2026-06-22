# Story: Testing Strategy

**Status**: Done
**Priority**: P0
**Estimated**: 3 days

## Goal

Define TDD workflow and testing approach.

## Context

- Create `testing/README.md` with testing overview
- Create `testing/tdd.md` with TDD workflow
- Create `testing/backend.md` with backend testing
- Create `testing/frontend.md` with frontend testing
- Create `testing/invariants.md` with ledger invariants
- Create `testing/sync.md` with sync testing

## Acceptance Criteria

- [x] TDD: write test before code
- [x] Backend: Vitest + Testcontainers PostgreSQL
- [x] Frontend: Vitest + Testing Library
- [x] E2E: Playwright
- [x] Invariants: ledger balance, money integers, user scoping
- [x] Sync: offline queue, conflict resolution

## Technical Notes

Testing docs are mandatory. Every use case must have tests.

## Tests Required

- Verify TDD workflow in practice
- Test infrastructure setup (Testcontainers, etc.)

## Dependencies

- 011-architecture-foundations.md
- 003-api-model.md

## Done Checklist

- [x] All acceptance criteria met
- [x] Testing docs complete and reviewed
