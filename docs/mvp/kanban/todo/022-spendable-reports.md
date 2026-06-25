# Story: Spendable Balance & Reports

**Status**: Todo
**Priority**: P0
**Estimated**: 3 days

## Goal

Implement reports endpoints and UI for spendable balance, expenses by category, liabilities/debt progress, and balance sign conventions with runtime-derived calculations.

## Context

- Spendable balance is core MVP metric: money available after envelopes + upcoming obligations
- Users need expense reporting by category for budgeting insights
- Liability/debt progress tracking motivates payoff
- Balance sign conventions must be consistent: positive = asset, negative = liability
- All calculations runtime-derived (no stored balances), ensuring accuracy

## Acceptance Criteria

- [ ] Reports API endpoints (spendable, expenses-by-category, debt-progress)
- [ ] Spendable balance calculation: (account balances) - (envelope allocations) - (upcoming obligations)
- [ ] Expenses by category report (with date range filter)
- [ ] Liabilities/debt progress report (principal, interest, payoff date)
- [ ] Balance sign conventions documented and enforced (positive=asset, negative=liability)
- [ ] Runtime-derived calculations (no cached/stored balances)
- [ ] Reports UI: charts/tables for each report type
- [ ] Date range filtering on all reports
- [ ] Export report data (CSV/JSON)

## Technical Notes

Reports API endpoints:
- `GET /api/v1/reports/spendable?date=` - Spendable balance
- `GET /api/v1/reports/expenses-by-category?start=&end=` - Expenses by category
- `GET /api/v1/reports/debt-progress?date=` - Debt payoff progress
- `GET /api/v1/reports/balance-history?start=&end=` - Balance over time

Spendable balance formula:
```
spendable = 
  sum(account_balances) 
  - sum(envelope_allocations) 
  - sum(upcoming_obligations)
```

Balance sign convention:
- Assets (checking, savings): positive balance
- Liabilities (credit cards, loans): negative balance
- Net worth = sum(all account balances)

Runtime derivation:
- Calculate from transaction lines, not stored balances
- Use efficient queries with date filters
- Cache invalidation via TanStack Query

Files/modules to touch:
- `packages/application/src/reports/reports.service.ts`
- `apps/api/src/reports/reports.controller.ts` (ts-rest contract)
- `apps/web/src/reports/` (components, hooks, pages)
- `packages/domain/src/reports/` (types and interfaces)

## Tests Required

- [ ] Unit tests: spendable balance calculation (edge cases)
- [ ] Unit tests: expense grouping by category
- [ ] Unit tests: debt progress calculation (interest, minimum payments)
- [ ] Unit tests: balance sign convention enforcement
- [ ] Integration tests: reports API endpoints
- [ ] Integration tests: date range filtering
- [ ] E2E tests: reports UI renders correctly
- [ ] E2E tests: export report data
- [ ] Performance tests: large dataset report generation

## Dependencies

- 017-accounts-transactions-foundation.md
- 021-envelopes-budgeting.md (for envelope allocations in spendable)
- 028-paycheck-plans-upcoming-obligations.md (for upcoming obligations)

## Done Checklist

- [ ] All acceptance criteria met
- [ ] Spendable balance formula verified with integration tests
- [ ] Reports UI functional and responsive
- [ ] Balance sign conventions consistent across API and UI
- [ ] Date filtering works on all reports
- [ ] Export functionality tested
- [ ] Performance acceptable (<500ms for reports with 1000+ transactions)
