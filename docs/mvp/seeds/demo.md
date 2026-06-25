# Demo Seed

## Purpose

Realistic sample data for demos and development.

## Data

### Accounts (5)

1. BBVA Debit - Checking account
2. BBVA Credit - Credit card
3. Nu Credit - Credit card
4. Cash - Cash on hand
5. Savings - Emergency fund

### Envelopes (10+)

1. Food - Groceries and dining
2. Transport - Gas, Uber, metro
3. Utilities - Electricity, water, internet
4. Rent - Housing
5. Entertainment - Movies, hobbies
6. Emergency Fund - 3-month buffer
7. Tax Reserve - For accountant
8. Debt Payoff - Extra debt payments
9. Gifts - Birthdays, holidays
10. Education - Courses, books

### Transactions (50+)

- Expenses: groceries, dining, transport, utilities
- Income: biweekly paychecks
- Transfers: between accounts
- Debt payments: credit card payments

### Categories (15+)

Food, Transport, Utilities, Rent, Entertainment, Health, Education, Gifts, Debt, Savings, Income, Transfer, etc.

## Implementation

```typescript
// libs/testing/seeds/demo.ts
export async function seedDemo(db: DrizzleDb) {
  const user = await createUser(db, { email: "demo@ledger-mx.com" });
  const accounts = await createAccounts(db, user.id);
  const envelopes = await createEnvelopes(db, user.id);
  const categories = await createCategories(db, user.id);
  const transactions = await createTransactions(
    db,
    user.id,
    accounts,
    categories,
  );
}
```

## Usage

```bash
pnpm seed:demo
```
