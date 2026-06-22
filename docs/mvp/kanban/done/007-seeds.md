# Story: Seeds

**Status**: Todo
**Priority**: P1
**Estimated**: 2 days

## Goal

Create seed data for demo and personal use.

## Context

- Create `seeds/README.md` with seed strategy
- Create `seeds/demo.md` with demo seed data
- Create `seeds/personal.md` with personal seed data
- Create `seeds/coverage.md` with seed coverage requirements

## Acceptance Criteria

- [ ] Demo seed: 3-5 accounts, 10+ envelopes, 50+ transactions
- [ ] Personal seed: user's real accounts and categories (local-only, gitignored)
- [ ] Seeds include user_id for all records
- [ ] Seeds resettable for testing

## Technical Notes

Seeds are required for development and E2E tests. Use faker.js for demo data. Personal seed files must be local-only and added to `.gitignore`.

## Tests Required

- Test seed data integrity
- Test seed reset functionality

## Dependencies

- 001-database-model.md
- 006-testing-strategy.md

## Done Checklist

- [ ] All acceptance criteria met
- [ ] Seeds working for dev and E2E
