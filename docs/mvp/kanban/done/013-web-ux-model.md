# Story: Web UX Model

**Status**: Done
**Priority**: P0
**Estimated**: 5 days
**Completed**: ~5 days

## Goal

Design web app UX with transaction flow.

## Context

- [x] Create `web/ux-principles.md` with UX principles
- [x] Create `web/transaction-flow.md` with transaction creation flow
- [x] Create `web/routes.md` with route definitions
- [x] Create `web/state-data-boundaries.md` with state management
- [x] Create `web/calendar.md` with financial calendar
- [x] Create `web/wireframes.md` with wireframe links

## Acceptance Criteria

- [x] Transaction flow: quick entry, category select, account select
- [x] Routes: /, /transactions, /accounts, /envelopes, /reports
- [x] State: TanStack Query + Store
- [x] Calendar shows upcoming obligations
- [x] Wireframes documented (parallel planning)

## Technical Notes

Web docs must include transaction UX flow and manual fields.

Key additions:

- Financial invariants: integer cents, UUID v4, double-entry, UTC timestamps, no hard deletes
- React Hook Form requirement for all forms
- TanStack Router/Query patterns with credentials: 'include'
- User-scoped data (user_id) for all financial queries
- API routes under /api/v1

## Tests Required

- Test UX flows with prototypes
- Test state management

## Dependencies

- 011-architecture-foundations.md
- 003-api-model.md

## Done Checklist

- [x] All acceptance criteria met
- [x] UX documentation complete
