# Accounts and Envelopes

## Spendable Balance Formula

```
Real account balance
- Protected envelopes
- Upcoming required payments
= Real spendable balance
```

## Account Types

- DEBIT: Checking account (BBVA Debit)
- CREDIT: Credit card (BBVA Credit, Nu Credit)
- LOAN: Long-term loan
- SAVINGS: Savings account
- CASH: Physical cash

## Account Schema

```typescript
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  type: accountTypeEnum("type").notNull(),
  balanceCents: integer("balance_cents").notNull().default(0),
  creditLimitCents: integer("credit_limit_cents"), // for credit
});
```

## Envelopes

Protected allocations within accounts.

```typescript
export const envelopes = pgTable("envelopes", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  allocatedCents: integer("allocated_cents").notNull().default(0),
  targetCents: integer("target_cents"), // optional goal
});
```

## Envelope Allocation

Transaction type: envelope_allocation

- Line 1: debit account (-amount)
- Line 2: credit envelope (+amount)

## Example

```
BBVA Debit:             $10,000
Emergency Fund:          -$2,000
Upcoming rent:           -$1,500
=========================
Spendable:              $6,500
```
