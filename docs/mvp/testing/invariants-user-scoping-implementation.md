# User Scoping Implementation

## Drizzle Repository Implementation

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

## API-layer Authorization Tests

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

## Key Points

- Always include `userId` in WHERE clause for UPDATE and DELETE
- Return 404 (not 403) to avoid leaking existence of other users' data
- Use `and()` combinator to combine id and userId filters

## Related

- [User Scoping Invariant](./invariants-user-scoping.md) - rule and tests
- [Invariants Overview](./invariants.md) - all invariants index
