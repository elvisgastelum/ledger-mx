# Story: Debt Tracking & Payoff Progress

**Status**: Todo
**Priority**: P0
**Estimated**: 3 days

## Goal

Implement debt account tracking, payoff progress visualization, liability reports, and debt payment transaction flow with comprehensive tests.

## Context

- Users need to track debt accounts (credit cards, loans, mortgages)
- Payoff progress visualization motivates users and shows path to debt-free
- Liability reports show debt-to-income, interest accumulation, payoff timeline
- Debt payment transactions must properly handle liability account reductions
- Integration with spendable balance and reports (022)

## Acceptance Criteria

- [ ] Debt account type: credit card, loan, mortgage with interest rate
- [ ] Debt account UI: add/edit debt account with terms (balance, APR, min payment)
- [ ] Payoff progress visualization: bar/circle showing progress to payoff date
- [ ] Debt payment transaction flow: payment reduces liability balance
- [ ] Liability reports: debt summary, interest projection, payoff timeline
- [ ] Debt snowball/avalanche method support (future enhancement ready)
- [ ] Minimum payment tracking and alerts (future enhancement ready)
- [ ] Debt account balance history chart
- [ ] Integration with spendable balance (debt reduces net worth)

## Technical Notes

Debt account model:
```typescript
interface DebtAccount extends Account {
  debtType: 'credit_card' | 'loan' | 'mortgage';
  currentBalance: number; // Negative number
  apr: number; // Annual percentage rate (e.g., 0.1999 for 19.99%)
  minimumPayment: number;
  originalPrincipal: number;
  termMonths?: number; // For loans/mortgages
  payoffDate?: Date; // Calculated
}
```

Payoff calculation:
```typescript
function calculatePayoff(debt: DebtAccount, monthlyPayment: number): {
  monthsToPayoff: number;
  totalInterest: number;
  payoffDate: Date;
} {
  // Standard loan amortization formula
  const monthlyRate = debt.apr / 12;
  const balance = Math.abs(debt.currentBalance);
  
  if (monthlyPayment <= balance * monthlyRate) {
    return { monthsToPayoff: Infinity, totalInterest: Infinity, payoffDate: null };
  }
  
  const months = -Math.log(1 - (balance * monthlyRate / monthlyPayment)) 
    / Math.log(1 + monthlyRate);
  
  return {
    monthsToPayoff: Math.ceil(months),
    totalInterest: (monthlyPayment * months) - balance,
    payoffDate: addMonths(new Date(), Math.ceil(months)),
  };
}
```

Debt payment transaction:
- Debit from asset account (checking)
- Credit to liability account (reduces balance, makes it more positive)
- Example: Pay $100 to credit card
  - Checking: -100
  - Credit Card: +100 (balance goes from -500 to -400)

Files/modules to touch:
- `packages/domain/src/account/account.entity.ts` (add debt fields)
- `packages/application/src/debt/debt.service.ts`
- `apps/api/src/debt/debt.controller.ts` (ts-rest)
- `apps/web/src/debt/` (components, pages, charts)
- `apps/web/src/reports/components/DebtReport.tsx`
- `apps/web/src/accounts/components/DebtAccountForm.tsx`

## Tests Required

- [ ] Unit tests: debt account creation with terms
- [ ] Unit tests: payoff calculation accuracy (verify with online calculators)
- [ ] Unit tests: debt payment transaction flow
- [ ] Unit tests: balance history tracking
- [ ] Integration tests: debt account API
- [ ] Integration tests: debt payment transaction API
- [ ] Integration tests: liability reports API
- [ ] E2E tests: add debt account flow
- [ ] E2E tests: record debt payment flow
- [ ] E2E tests: view payoff progress
- [ ] E2E tests: debt integration with spendable balance

## Dependencies

- 017-accounts-transactions-foundation.md
- 022-spendable-reports.md (for liability reports)
- 026-system-account-balance-semantics.md (for liability sign conventions)

## Done Checklist

- [ ] All acceptance criteria met
- [ ] Debt accounts properly track liability balances
- [ ] Payoff progress visualization displays correctly
- [ ] Debt payment transactions work end-to-end
- [ ] Liability reports accurate and informative
- [ ] Debt balances correctly reduce net worth
- [ ] Tests pass for all debt functionality
- [ ] Cross-user isolation verified (debt accounts)
