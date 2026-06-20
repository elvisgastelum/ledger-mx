# Reports API

Endpoints for financial reports.

## Endpoints

### GET /reports/spendable-balance

Current spendable balance.

**Response:**
```json
{
  "data": {
    "totalBalanceCents": 100000,
    "protectedEnvelopesCents": 20000,
    "upcomingPaymentsCents": 15000,
    "spendableBalanceCents": 65000
  }
}
```

### GET /reports/expenses-by-category

Expenses grouped by category.

**Query:** startDate, endDate, groupBy

### GET /reports/debt-progress

Debt payoff progress.

**Response:** Original balance, current balance, progress %, estimated payoff date.

### GET /reports/upcoming-payments

Payments due before next income.

### GET /reports/protected-envelopes

Envelope allocations and targets.

### GET /reports/monthly-net-cashflow

Income minus expenses by month.

### GET /reports/financial-calendar

Calendar events for a month.

## Filters

All reports support: dateRange, accountIds, categoryIds.

## Implementation

```typescript
async getSpendableBalance(userId: string) {
  const accounts = await this.accountRepo.findDebitAccounts(userId);
  const envelopes = await this.envelopeRepo.findActive(userId);
  const upcoming = await this.getUpcomingPayments(userId);
  
  return {
    totalBalanceCents: sum(accounts, 'balanceCents'),
    protectedEnvelopesCents: sum(envelopes, 'allocatedCents'),
    upcomingPaymentsCents: sum(upcoming, 'amountCents'),
    spendableBalanceCents: /* calculation */,
  };
}
```
