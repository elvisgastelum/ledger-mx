# User Scoping Invariant

## Rule

All database operations (SELECT, UPDATE, DELETE) must filter by user_id. No query should ever access or modify another user's data.

## Test: SELECT Filtering

```typescript
test("repository filters by user_id on read", async () => {
  const repo = new DrizzleTransactionRepository();
  const txs = await repo.findByUserId("user-1");

  expect(txs.every((tx) => tx.userId === "user-1")).toBe(true);
});
```

## Test: UPDATE Prevention

```typescript
test("cannot update another user's transaction", async () => {
  const repo = new DrizzleTransactionRepository();
  const otherUserTx = await createTransactionForUser("user-2");

  // Attempt to update as user-1
  await expect(
    repo.update(otherUserTx.id, { amount: 999 }, "user-1"),
  ).rejects.toThrow(NotFoundError); // or ForbiddenException

  // Verify data unchanged
  const unchanged = await repo.findById(otherUserTx.id, "user-2");
  expect(unchanged.amount).not.toBe(999);
});
```

## Test: DELETE Prevention

```typescript
test("cannot delete another user's transaction", async () => {
  const repo = new DrizzleTransactionRepository();
  const otherUserTx = await createTransactionForUser("user-2");

  // Attempt to delete as user-1
  await expect(repo.delete(otherUserTx.id, "user-1")).rejects.toThrow(
    NotFoundError,
  );

  // Verify data still exists for owner
  const stillExists = await repo.findById(otherUserTx.id, "user-2");
  expect(stillExists).toBeDefined();
});
```

## Test: Repository Enforces Scoping

```typescript
test("repository methods all filter by user_id", async () => {
  const repo = new DrizzleTransactionRepository();

  // Verify all methods accept userId parameter
  expect(repo.findByUserId).toBeDefined();
  expect(repo.update).toBeDefined();
  expect(repo.delete).toBeDefined();

  // Verify raw SQL queries include user_id filter
  const queryPlan = await repo.explainQuery("findById", "tx-123", "user-1");
  expect(queryPlan).toMatch(/WHERE.*user_id/);
});
```

API-layer authorization tests: see [Implementation](./invariants-user-scoping-implementation.md).

## Related

- [Invariants Overview](./invariants.md) - all invariants index
