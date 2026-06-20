# Invariants

## Critical Business Rules

Invariants must never be violated. Test them explicitly.

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

## Money Invariant

### Rule

All monetary values must be integer cents (no floats).

### Test

```typescript
test('money must be integer', () => {
  expect(() => assertValidMoney(123.45)).toThrow();
  expect(() => assertValidMoney(12345)).not.toThrow();
});
```

## User Scoping Invariant

### Rule

All database operations (SELECT, UPDATE, DELETE) must filter by user_id. No query should ever access or modify another user's data.

### Test: SELECT Filtering

```typescript
test('repository filters by user_id on read', async () => {
  const repo = new DrizzleTransactionRepository();
  const txs = await repo.findByUserId('user-1');
  
  expect(txs.every(tx => tx.userId === 'user-1')).toBe(true);
});
```

### Test: UPDATE Prevention

```typescript
test('cannot update another user\'s transaction', async () => {
  const repo = new DrizzleTransactionRepository();
  const otherUserTx = await createTransactionForUser('user-2');
  
  // Attempt to update as user-1
  await expect(
    repo.update(otherUserTx.id, { amount: 999 }, 'user-1')
  ).rejects.toThrow(NotFoundError); // or ForbiddenException
  
  // Verify data unchanged
  const unchanged = await repo.findById(otherUserTx.id, 'user-2');
  expect(unchanged.amount).not.toBe(999);
});
```

### Test: DELETE Prevention

```typescript
test('cannot delete another user\'s transaction', async () => {
  const repo = new DrizzleTransactionRepository();
  const otherUserTx = await createTransactionForUser('user-2');
  
  // Attempt to delete as user-1
  await expect(
    repo.delete(otherUserTx.id, 'user-1')
  ).rejects.toThrow(NotFoundError);
  
  // Verify data still exists for owner
  const stillExists = await repo.findById(otherUserTx.id, 'user-2');
  expect(stillExists).toBeDefined();
});
```

### Test: Repository Enforces Scoping

```typescript
test('repository methods all filter by user_id', async () => {
  const repo = new DrizzleTransactionRepository();
  
  // Verify all methods accept userId parameter
  expect(repo.findByUserId).toBeDefined();
  expect(repo.update).toBeDefined();
  expect(repo.delete).toBeDefined();
  
  // Verify raw SQL queries include user_id filter
  const queryPlan = await repo.explainQuery('findById', 'tx-123', 'user-1');
  expect(queryPlan).toMatch(/WHERE.*user_id/);
});
```

### Test: API-layer Authorization (HTTP)

```typescript
test('GET another user\'s transaction returns 404', async () => {
  const otherUserTx = await createTransactionForUser('user-2');

  const response = await request(app.getHttpServer())
    .get(`/api/transactions/${otherUserTx.id}`)
    .set('Authorization', `Bearer ${user1Token}`);

  expect(response.status).toBe(404); // Or 403 - must be consistent
});

test('PUT another user\'s transaction returns 404', async () => {
  const otherUserTx = await createTransactionForUser('user-2');

  const response = await request(app.getHttpServer())
    .put(`/api/transactions/${otherUserTx.id}`)
    .set('Authorization', `Bearer ${user1Token}`)
    .send({ amountCents: 99900 });

  expect(response.status).toBe(404);
});

test('DELETE another user\'s transaction returns 404', async () => {
  const otherUserTx = await createTransactionForUser('user-2');

  const response = await request(app.getHttpServer())
    .delete(`/api/transactions/${otherUserTx.id}`)
    .set('Authorization', `Bearer ${user1Token}`);

  expect(response.status).toBe(404);
});
```

### Implementation: User Scoping in Drizzle

```typescript
// libs/infrastructure/drizzle/repositories/transaction.repository.ts
export class DrizzleTransactionRepository {
  async update(id: string, data: Partial<Transaction>, userId: string) {
    const result = await db
      .update(transactions)
      .set(data)
      .where(and(
        eq(transactions.id, id),
        eq(transactions.userId, userId) // Critical: always filter by userId
      ))
      .returning();
    
    if (result.length === 0) {
      throw new NotFoundException('Transaction not found or access denied');
    }
    
    return result[0];
  }
  
  async delete(id: string, userId: string) {
    const result = await db
      .delete(transactions)
      .where(and(
        eq(transactions.id, id),
        eq(transactions.userId, userId)
      ))
      .returning();
    
    if (result.length === 0) {
      throw new NotFoundException('Transaction not found or access denied');
    }
  }
}
```

## ID Invariant

### Rule

All IDs must be UUID v4 format.

### Test

```typescript
test('ID must be UUID v4', () => {
  expect(() => new UserId('invalid')).toThrow();
  expect(() => new UserId(crypto.randomUUID())).not.toThrow();
});
```
