# Data Isolation

## Rule: User-Scoped Data

All financial data must be scoped to a user. No user can access another user's data.

## Database Level

### Every Table Has user_id

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  amount_cents INTEGER NOT NULL,
  -- ...
);
```

### Row-Level Security (Future)

PostgreSQL RLS not used in MVP. Application-level filtering instead.

## Application Level

### Repository Pattern

All repository methods filter by user_id:

```typescript
class TransactionRepository {
  async findByUserId(userId: string): Promise<Transaction[]> {
    return db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId));
  }
}
```

### Use Case Level

Use cases validate user owns the resource:

```typescript
async getTransaction(id: string, userId: string) {
  const tx = await this.repo.findById(id);
  if (tx.userId !== userId) {
    throw new ForbiddenException();
  }
  return tx;
}
```

## API Level

### JWT Middleware

Extract user_id from JWT, pass to use cases:

```typescript
// NestJS guard sets req.user
req.user = { userId: "...", email: "..." };
```

## Testing Data Isolation

Write tests that verify user A cannot access user B's data.
