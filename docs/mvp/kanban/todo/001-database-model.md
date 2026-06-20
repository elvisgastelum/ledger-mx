# Story: Database Model

**Status**: Todo
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

- [ ] All tables include `user_id` column
- [ ] Schema overview shows relationships
- [ ] Accounts support debit, credit, loan, savings, cash
- [ ] Envelopes support protected allocations
- [ ] Financial rules document spendable balance formula
- [ ] Migrations use Drizzle declarative approach

## Technical Notes

Database schema is critical for user data isolation and financial accuracy.

## Tests Required

- Test user scoping on all tables
- Test migration rollback

## Dependencies

- 011-architecture-foundations.md

## Done Checklist

- [ ] All acceptance criteria met
- [ ] Schema reviewed and approved
