# Story: MVP Validation

**Status**: Todo
**Priority**: P0
**Estimated**: 2 days

## Goal

Validate MVP against success criteria. This is the final gate before MVP release.

## Context

- **BLOCKED** by P0 blocker stories (018-024, 028-029)
- Verify all MVP success criteria from `product/mvp-scope.md`
- Test offline sync decision outcome (implement or scoped down)
- Validate envelope budgeting and spendable balance formula
- Verify financial safety: no hard deletes, reversal/correction works
- Run comprehensive cross-user isolation tests
- Test dashboard flow and key metrics display
- Verify categories CRUD and defaults
- Execute full test suite and manual validation checklist

## Acceptance Criteria

### Financial Safety & Integrity
- [ ] No hard deletes on financial records (transactions, accounts)
- [ ] Reversal/correction transactions work correctly
- [ ] Transaction audit trail preserved
- [ ] Ledger invariants pass (transaction lines sum to zero)

### Core Features Validation
- [ ] Categories CRUD functional with defaults
- [ ] Envelope budgeting system works end-to-end
- [ ] Spendable balance formula accurate
- [ ] Reports generate correctly (spendable, expenses by category, debt)
- [ ] Dashboard displays key metrics (spendable, accounts, envelopes, recent transactions)
- [ ] Dashboard protected and user-scoped
- [ ] Paycheck planning allocates to envelopes correctly
- [ ] Upcoming obligations tracked and reflected in spendable
- [ ] Debt accounts track liability balances correctly
- [ ] Debt payoff progress visualization displays accurately

### Export & Data Portability
- [ ] CSV export produces audit-ready fields (date, description, amount, account, envelope, category, transaction_type, user_id scoped)
- [ ] CSV export is user-scoped (only exports authenticated user's data)
- [ ] CSV export includes all financial records (transactions, accounts, envelopes) in consistent format
- [ ] CSV export handles large datasets without truncation
- [ ] Exported CSV validates mathematically (debits = credits per transaction)

### Offline Sync Decision
- [ ] Offline sync decision documented and implemented OR formally scoped out
- [ ] If implemented: offline/online sync tested without data loss
- [ ] If scoped out: MVP scope docs updated, no offline assumptions in tests

### Security & Isolation
- [ ] Cross-user isolation verified for all financial endpoints
- [ ] Auth refresh token rotation works (if 025 implemented)
- [ ] No sensitive data in logs (if 025 implemented)

### Testing & Quality
- [ ] Full automated test suite passes (>80% coverage on critical paths)
- [ ] Cross-user isolation tests pass
- [ ] Manual validation checklist executed (20+ items)
- [ ] Performance acceptable (< 200ms UI response, < 500ms reports)

### User Experience
- [ ] Transaction lifecycle complete (create, view, edit, correct, reverse)
- [ ] Filtering and pagination on transaction list
- [ ] Quick entry flows functional (add transaction, transfer, fund envelope)
- [ ] Loading/error/empty states present

## Technical Notes

This story is the final validation gate. Do not move to "Done" until all P0 blockers complete.

P0 Blocker Dependencies (must complete before starting this story):
- 018-financial-safety-reversals.md
- 019-mvp-test-coverage.md
- 020-categories-crud-defaults.md
- 021-envelopes-budgeting.md
- 022-spendable-reports.md
- 023-dashboard-ux.md
- 024-offline-sync-scope-decision.md
- 028-paycheck-plans-upcoming-obligations.md
- 029-debt-tracking-payoff.md

P1 Recommended (complete before MVP if possible):
- 025-auth-session-security-hardening.md
- 026-system-account-balance-semantics.md
- 027-transaction-lifecycle-ux.md

> **Note:** 028-paycheck-plans-upcoming-obligations.md and 029-debt-tracking-payoff.md are now P0 blockers for MVP validation. If the team decides to defer paycheck allocation or debt payoff progress from MVP scope, update `docs/mvp/product/mvp-scope.md` and this validation gate explicitly to reflect the scope change.

P2 Nice-to-Have (can defer to post-MVP):
- 030-frontend-ux-accessibility-polish.md
- 031-operational-readiness-health.md
- 009-deployment.md

## Tests Required

- Full E2E test suite execution
- Performance testing (UI response, report generation)
- Offline/online sync testing (if implemented)
- Cross-user isolation comprehensive testing
- Manual validation checklist (see `docs/mvp/testing/manual-checklist.md`)

## Dependencies

### P0 Blockers (Must Complete First)
- 018-financial-safety-reversals.md
- 019-mvp-test-coverage.md
- 020-categories-crud-defaults.md
- 021-envelopes-budgeting.md
- 022-spendable-reports.md
- 023-dashboard-ux.md
- 024-offline-sync-scope-decision.md
- 028-paycheck-plans-upcoming-obligations.md
- 029-debt-tracking-payoff.md

### Foundation (Already Done)
- 001-database-model.md
- 002-ledger-model.md
- 003-api-model.md
- 004-auth-session-model.md
- 005-sync-model.md
- 006-testing-strategy.md
- 007-seeds.md
- 008-export.md
- 010-product-foundations.md
- 011-architecture-foundations.md
- 013-web-ux-model.md
- 014-ts-rest-contracts.md
- 015-category-groups.md
- 016-category-layout-onboarding.md
- 017-accounts-transactions-foundation.md

## Done Checklist

- [ ] All P0 blocker stories complete
- [ ] All acceptance criteria met
- [ ] No critical bugs (P0/P1)
- [ ] Performance benchmarks met
- [ ] Offline sync decision implemented and tested OR formally scoped out
- [ ] Cross-user isolation verified
- [ ] Financial safety validated (no hard deletes, reversals work)
- [ ] Manual validation checklist completed
- [ ] MVP ready for release
