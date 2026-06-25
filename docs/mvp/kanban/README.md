# Kanban - Implementation Stories

Stories are in `todo/`, `doing/`, `done/`, `archive/` folders.

## Workflow

1. Move story from `todo/` → `doing/` when starting
2. Move story from `doing/` → `done/` when complete
3. Archive `done/` stories weekly to `archive/`

> **Scope Deferral Note:** 028-paycheck-plans-upcoming-obligations.md and 029-debt-tracking-payoff.md are currently P0 blockers for MVP validation. If the team decides to defer paycheck allocation or debt payoff progress from MVP scope, update `docs/mvp/product/mvp-scope.md` and `docs/mvp/kanban/todo/012-mvp-validation.md` explicitly to reflect the scope change.

## TODO Index (Canonical Order - Implementation/Control Order)

> **Note:** The files listed below represent the current MVP backlog in implementation priority order.
> P0 items are critical blockers. 012-mvp-validation.md is the final P0 gate and is blocked by 018-024 minimum.

### P0 Blockers (Must complete before MVP Validation)

1. 018-financial-safety-reversals.md - Financial safety: no hard deletes, reversals/corrections
2. 019-mvp-test-coverage.md - Comprehensive test coverage for critical paths
3. 020-categories-crud-defaults.md - Categories CRUD and default categories
4. 021-envelopes-budgeting.md - Envelope budgeting system
5. 022-spendable-reports.md - Spendable balance and reports
6. 023-dashboard-ux.md - Dashboard implementation with key metrics
7. 024-offline-sync-scope-decision.md - Offline sync decision (implement or defer)
8. 028-paycheck-plans-upcoming-obligations.md - Paycheck planning and obligations
9. 029-debt-tracking-payoff.md - Debt tracking and payoff progress

### P0 Gate (Blocked by P0 Blockers Above)

10. 012-mvp-validation.md - MVP validation (final gate, blocked by 018-024, 028-029)

### P1 Enhancements (Recommended Before MVP, But Not Blocking)

11. 025-auth-session-security-hardening.md - Auth security hardening
12. 026-system-account-balance-semantics.md - System accounts and balance semantics
13. 027-transaction-lifecycle-ux.md - Transaction detail/correction/reversal UX

### P2 Operational & Polish (Nice to Have for MVP)

14. 030-frontend-ux-accessibility-polish.md - Frontend UX and accessibility
15. 031-operational-readiness-health.md - Operational readiness and health endpoints
16. 009-deployment.md - Deployment (existing P2, operational/deployment work)

## DOING Index

(empty)

## DONE Index

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

## Story Template

See `done/001-database-model.md` for required headings.

## MVP Stories

### Database & API (Foundations)

- 001-database-model.md (done)
- 002-ledger-model.md (done)
- 003-api-model.md (done)
- 004-auth-session-model.md (done)
- 005-sync-model.md (done)
- 015-category-groups.md (done)
- 016-category-layout-onboarding.md (done)
- 017-accounts-transactions-foundation.md (done)

### Financial Safety & Core Features (P0)

- 018-financial-safety-reversals.md (todo) - **BLOCKER**
- 020-categories-crud-defaults.md (todo) - **BLOCKER**
- 021-envelopes-budgeting.md (todo) - **BLOCKER**
- 022-spendable-reports.md (todo) - **BLOCKER**
- 023-dashboard-ux.md (todo) - **BLOCKER**
- 024-offline-sync-scope-decision.md (todo) - **BLOCKER**
- 028-paycheck-plans-upcoming-obligations.md (todo) - **BLOCKER**
- 029-debt-tracking-payoff.md (todo) - **BLOCKER**

### Testing & Validation (P0)

- 006-testing-strategy.md (done)
- 007-seeds.md (done)
- 008-export.md (done)
- 019-mvp-test-coverage.md (todo) - **BLOCKER**
- 012-mvp-validation.md (todo) - **Final gate, blocked by 018-024, 028-029**

### Security & Enhancements (P1)

- 025-auth-session-security-hardening.md (todo)
- 026-system-account-balance-semantics.md (todo)
- 027-transaction-lifecycle-ux.md (todo)

### Product & Architecture

- 010-product-foundations.md (done)
- 011-architecture-foundations.md (done)
- 013-web-ux-model.md (done)
- 014-ts-rest-contracts.md (done)

### Operational & Polish (P2)

- 030-frontend-ux-accessibility-polish.md (todo)
- 031-operational-readiness-health.md (todo)
- 009-deployment.md (todo) - operational/deployment work
