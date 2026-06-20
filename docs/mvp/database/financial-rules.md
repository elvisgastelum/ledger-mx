# Financial Rules

Configurable rules, not hardcoded logic.

## Income Rules

### Biweekly Paycheck

```typescript
interface IncomeRule {
  type: 'biweekly';
  startDate: Date;
  amountCents: number;
  dayOfWeek: 5; // Friday
}
```

### Three-Paycheck Months

Third paycheck reduced (multiplier: 0.5).

### Monthly Reserves

Auto-allocate per paycheck:
- Accountant reserve: $200
- Tax reserve: $300
- Emergency fund: $100 (optional)

## Paycheck Plans

Allocate income to envelopes and payments:

```typescript
interface PaycheckPlan {
  incomeAmountCents: number;
  items: PaycheckPlanItem[];
}
```

## Debt Payoff Rules

- Strategy: snowball (smallest balance) or avalanche (highest interest)
- Minimum payments first
- Extra allocation per paycheck

## Envelope Rules

Reserve envelope funds for recurring charges (2 months ahead).

## Emergency Fund Rules

Contribution after debt payoff. Target: 3-6 months expenses.

## Testing Rules

Test biweekly rule generates 26 paychecks per year.
