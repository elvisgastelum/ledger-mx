# Story: Paycheck Plans & Upcoming Obligations

**Status**: Todo
**Priority**: P0
**Estimated**: 3 days

## Goal

Implement paycheck planning, upcoming required payments tracking, allocation rules to envelopes, and recurring charges needed for accurate spendable formula.

## Context

- Users need to plan income allocation from paychecks to envelopes
- Upcoming obligations (rent, utilities, subscriptions) must be tracked
- Allocation rules automate paycheck → envelope funding
- Recurring charges feed into spendable balance formula (see 022)
- Paycheck planning helps users visualize cash flow

## Acceptance Criteria

- [ ] Paycheck planning UI: schedule paycheck date, amount, allocation rules
- [ ] Upcoming obligations list: track required payments with due dates
- [ ] Obligation types: recurring (monthly) and one-time
- [ ] Allocation rules: define % or $ amount from paycheck to envelopes
- [ ] Auto-apply allocation rules when paycheck transaction recorded
- [ ] Upcoming obligations feed into spendable balance calculation
- [ ] Calendar view or timeline of income vs obligations
- [ ] Alert/notification for upcoming obligations (future enhancement)
- [ ] Recurring charge management (create, update, pause, cancel)

## Technical Notes

Paycheck plan model:
```typescript
interface PaycheckPlan {
  id: string;
  userId: string;
  name: string; // "Bi-weekly Paycheck"
  expectedAmount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  nextDate: Date;
  allocationRules: AllocationRule[];
}

interface AllocationRule {
  envelopeId: string;
  type: 'percentage' | 'fixed';
  value: number; // 50 (%) or 500 ($)
}
```

Upcoming obligation model:
```typescript
interface UpcomingObligation {
  id: string;
  userId: string;
  name: string;
  amount: number;
  dueDate: Date;
  isRecurring: boolean;
  frequency?: 'weekly' | 'monthly' | 'yearly';
  categoryId?: string;
  envelopeId?: string;
  isPaid: boolean;
  paidTransactionId?: string;
}
```

Spendable formula integration:
```
spendable = 
  sum(account_balances) 
  - sum(envelope_allocations) 
  - sum(upcoming_obligations where dueDate <= nextPaycheckDate)
```

Files/modules to touch:
- `packages/domain/src/paycheck/paycheck.entity.ts`
- `packages/domain/src/obligation/obligation.entity.ts`
- `packages/application/src/paycheck/paycheck.service.ts`
- `packages/application/src/obligation/obligation.service.ts`
- `packages/infra/src/database/repositories/paycheck.repository.ts`
- `packages/infra/src/database/repositories/obligation.repository.ts`
- `apps/api/src/paycheck/paycheck.controller.ts` (ts-rest)
- `apps/api/src/obligation/obligation.controller.ts` (ts-rest)
- `apps/web/src/paycheck/` (components, pages)
- `apps/web/src/obligation/` (components, pages)

## Tests Required

- [ ] Unit tests: paycheck plan creation and validation
- [ ] Unit tests: allocation rule application
- [ ] Unit tests: upcoming obligation tracking
- [ ] Unit tests: recurring obligation generation
- [ ] Integration tests: paycheck API endpoints
- [ ] Integration tests: obligation API endpoints
- [ ] Integration tests: spendable formula with obligations
- [ ] E2E tests: paycheck planning flow
- [ ] E2E tests: obligation management flow
- [ ] E2E tests: allocation rules auto-apply

## Dependencies

- 017-accounts-transactions-foundation.md
- 021-envelopes-budgeting.md (for envelope allocation)
- 022-spendable-reports.md (for formula integration)

## Done Checklist

- [ ] All acceptance criteria met
- [ ] Paycheck planning UI functional
- [ ] Upcoming obligations tracked and displayed
- [ ] Allocation rules auto-apply correctly
- [ ] Spendable balance includes upcoming obligations
- [ ] Recurring obligations generate correctly
- [ ] Tests pass for all new functionality
- [ ] Cross-user isolation verified
