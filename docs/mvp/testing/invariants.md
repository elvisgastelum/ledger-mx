# Invariants

## Critical Business Rules

Invariants must never be violated. Test them explicitly.

Related invariant documentation:
- [Money Invariant](./invariants-money.md) - integer cents rule
- [User Scoping Invariant](./invariants-user-scoping.md) - data isolation
- [User Scoping Implementation](./invariants-user-scoping-implementation.md) - Drizzle implementation
- [ID Invariant](./invariants-id.md) - UUID v4 format rule

## Ledger Invariant

### Rule

Every transaction must balance (sum of lines = 0).

### Test

```typescript
// libs/domain/invariants/__tests__/ledger.invariant.test.ts
test('transaction must balance', () => {
  const tx = new Transaction({
    lines: [
      { amountCents: -10000 },
      { amountCents: 5000 }, // Unbalanced!
    ],
  });
  
  expect(() => assertTransactionBalances(tx)).toThrow();
});
```
