# Story: Database Model

**Status**: Done
**Priority**: P0
**Estimated**: 5 days

## Goal

Design and implement database schema with user scoping.

## Context

- Create `database/schema-overview.md` with ERD and tables
- Create `database/user-scope.md` with user_id requirement
- Create `database/accounts-envelopes.md` with account/envelope models
- Create `database/financial-rules.md` with business rules
- Create `database/migrations.md` with migration strategy

Spendable balance formula: Real account balance - Protected envelopes - Upcoming required payments = Real spendable balance

## Acceptance Criteria

- [x] All tables include `user_id` column
- [x] Schema overview shows relationships
- [x] Accounts support debit, credit, loan, savings, cash
- [x] Envelopes support protected allocations
- [x] Financial rules document spendable balance formula
- [x] Migrations use Drizzle declarative approach

## Technical Notes

Database schema is critical for user data isolation and financial accuracy.

## Tests Required

- Test user scoping on all tables
- Test migration rollback

## Notes

- Initial migration was generated with Drizzle Kit.
- MVP will use forward-only corrective migrations (no rollback SQL).
- Migration validation focuses on clean apply from an empty database.
- Destructive rollback testing is deferred until deployment/rollback strategy is finalized.
- ~~Test migration rollback~~ — decided: forward-only MVP approach; see notes above.

## Dependencies

- 011-architecture-foundations.md

## Done Checklist

- [x] All acceptance criteria met
- [x] Schema reviewed and approved
