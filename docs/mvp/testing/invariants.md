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
// libs/domain/src/ledger/transaction.test.ts
test("transaction must balance", () => {
  const line1 = new TransactionLine({
    id: lineId1,
    transactionId: transactionId,
    targetType: "account",
    targetId: accountId1,
    amountCents: -10000,
  });
  const line2 = new TransactionLine({
    id: lineId2,
    transactionId: transactionId,
    targetType: "account",
    targetId: accountId2,
    amountCents: 5000, // Unbalanced!
  });

  expect(
    () =>
      new Transaction({
        id: transactionId,
        userId: userId,
        type: "expense",
        occurredAt: new Date(),
        lines: [line1, line2],
      }),
  ).toThrow(UnbalancedTransactionError);
});
```
