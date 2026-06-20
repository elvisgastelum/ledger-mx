# Personal Seed

## Purpose

User's real accounts and categories for development.

## Data

### Accounts

Based on `product/example-accounts.md`:

1. BBVA Debit (debit)
2. BBVA Credit (credit, limit 50,000)
3. Nu Credit (credit, limit 30,000)
4. Cash (cash)

### Categories

User's real categories:

- Groceries
- Dining
- Transport
- Utilities
- Rent/Mortgage
- Entertainment
- Health
- Education
- Tax/Accountant
- Debt Payments

### Envelopes

User's real envelopes:

- Emergency Fund
- Tax Reserve
- Next Paycheck Allocation
- Debt Payoff

## Implementation

```typescript
// libs/testing/seeds/personal.ts
export async function seedPersonal(db: DrizzleDb, userId: string) {
  // Use real account names and categories
  // But use fake transaction data
}
```

## Sensitive Data

Do **not** use real transaction history. Only use real account names and categories.

## Local-Only Usage

The `seed:personal` command is **local-only** and must not be committed to version control. Personal seed files contain real user account names and categories that are specific to your local development environment.

**Implementation note**: Add personal seed files and any personal configuration to `.gitignore`. The implementation must add appropriate `.gitignore` entries to ensure personal seed data is not accidentally committed.

## Usage

```bash
pnpm seed:personal
```
