# TDD Workflow

## Red-Green-Refactor

### 1. Red: Write Failing Test

```typescript
// libs/domain/__tests__/transaction.test.ts
test("transaction must balance", () => {
  const tx = new Transaction({
    amountCents: 10000,
    lines: [
      { accountId: "a1", amountCents: -10000 },
      // Missing second line - unbalanced
    ],
  });

  expect(() => tx.validate()).toThrow();
});
```

### 2. Green: Write Minimal Code

```typescript
// libs/domain/entities/transaction.entity.ts
validate() {
  const total = this.lines.reduce((sum, line) => sum + line.amountCents, 0);
  if (total !== 0) {
    throw new Error('Transaction does not balance');
  }
}
```

### 3. Refactor: Improve Code

Extract validation to invariant:

```typescript
// libs/domain/invariants/ledger.invariant.ts
export function assertTransactionBalances(tx: Transaction) {
  // ...
}
```

## TDD Rules

1. Write test before code
2. Run test to see it fail
3. Write minimal code to pass
4. Run all tests to ensure nothing breaks
5. Refactor
6. Repeat

## NestJS TDD

Use `@nestjs/testing` for unit tests:

```typescript
const module = await Test.createTestingModule({
  providers: [CreateTransactionUseCase],
}).compile();
```
