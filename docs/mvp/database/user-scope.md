# User Scope and Data Isolation

All financial data scoped to user_id. No cross-user data leakage.

## Implementation

### Schema Level

Every financial table has user_id:

```typescript
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
});
```

### Application Level

All queries filter by user_id:

```typescript
async findByUserId(userId: string): Promise<Transaction[]> {
  return db.select().from(transactions)
    .where(eq(transactions.userId, userId));
}
```

### Electric Sync Level

Shapes user-scoped:

```typescript
const shape = {
  table: "transactions",
  where: `user_id = '${userId}'`,
};
```

## Authentication Flow

1. Login → JWT with user_id
2. Client includes JWT in requests
3. Server extracts user_id from JWT
4. All queries scoped to user_id

## Data Isolation Guarantees

1. Schema: user_id NOT NULL
2. Queries: filter by user_id
3. API: guards extract and validate user
4. Sync: shapes scoped per user
5. Tests: verify isolation with multiple users
