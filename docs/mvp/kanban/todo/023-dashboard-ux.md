# Story: Dashboard UX Implementation

**Status**: Todo
**Priority**: P0
**Estimated**: 2 days

## Goal

Replace dashboard stub with protected dashboard showing spendable balance, recent transactions, account summary, envelope status, quick entry, and proper loading/error/empty states.

## Context

- Current dashboard is a stub placeholder
- Users need immediate visibility into financial health upon login
- Dashboard must be protected (auth required) and user-scoped
- Key metrics: spendable balance, recent activity, account balances, envelope status
- Quick entry for common actions (add transaction, transfer, fund envelope)
- Proper UX states: loading skeletons, error boundaries, empty states

## Acceptance Criteria

- [ ] Protected dashboard route (redirect to login if unauthenticated)
- [ ] Spendable balance card with current amount
- [ ] Recent transactions list (last 10-20 transactions)
- [ ] Account summary cards (each account with balance)
- [ ] Envelope status overview (funded vs unfunded, top envelopes)
- [ ] Quick entry buttons/modals (add transaction, transfer, fund envelope)
- [ ] Loading skeleton states while data fetches
- [ ] Error states with retry capability
- [ ] Empty states when no data exists (new user)
- [ ] Dashboard data refreshes on mutation (TanStack Query invalidation)

## Technical Notes

Dashboard layout:
```
+-------------------------------------------+
|  Spendable Balance Card (prominent)       |
+-------------------------------------------+
|  Account Summary  |  Envelope Status      |
|  (card per acct)  |  (top 5 envelopes)    |
+-------------------------------------------+
|  Recent Transactions (last 20)            |
+-------------------------------------------+
|  Quick Actions: [+ Trans] [Transfer] [Fund]|
+-------------------------------------------+
```

Components to create:
- `apps/web/src/dashboard/components/SpendableBalanceCard.tsx`
- `apps/web/src/dashboard/components/AccountSummaryCard.tsx`
- `apps/web/src/dashboard/components/EnvelopeStatusCard.tsx`
- `apps/web/src/dashboard/components/RecentTransactionsList.tsx`
- `apps/web/src/dashboard/components/QuickActions.tsx`
- `apps/web/src/dashboard/components/DashboardSkeleton.tsx`
- `apps/web/src/dashboard/components/DashboardError.tsx`
- `apps/web/src/dashboard/components/DashboardEmpty.tsx`

Data fetching:
- Use TanStack Query hooks for each data type
- Parallel fetching for independent data
- Error boundaries around each section
- Polling or manual refresh option

Files/modules to touch:
- `apps/web/src/dashboard/` (entire directory)
- `apps/web/src/routes/dashboard.tsx` (or similar route file)

## Tests Required

- [ ] Component tests: each dashboard card renders correctly
- [ ] Component tests: loading skeletons display
- [ ] Component tests: error states with retry
- [ ] Component tests: empty states for new users
- [ ] E2E tests: dashboard loads after login
- [ ] E2E tests: dashboard data is user-scoped
- [ ] E2E tests: quick actions open correct modals
- [ ] E2E tests: data refreshes after mutation

## Dependencies

- 017-accounts-transactions-foundation.md
- 021-envelopes-budgeting.md (for envelope status)
- 022-spendable-reports.md (for spendable balance calculation)

## Done Checklist

- [ ] All acceptance criteria met
- [ ] Dashboard protected by auth guard
- [ ] All loading/error/empty states implemented
- [ ] Quick actions functional end-to-end
- [ ] Data user-scoped (no cross-user leakage)
- [ ] Responsive design (mobile-friendly)
- [ ] E2E tests pass for dashboard flows
