# Schema Overview

## Entity Relationship (Simplified)

```
users (1) ─── (N) accounts
users (1) ─── (N) envelopes
users (1) ─── (N) transactions
users (1) ─── (N) categories
transactions (1) ─── (N) transaction_lines
```

## Key Tables

### users

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | Client-generated |
| email | text UNIQUE | Login |

### accounts

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | user scoping |
| name | text | "BBVA Debit" |
| type | enum | debit/credit/loan/savings/cash |
| balance_cents | integer | Current balance |

### envelopes

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | |
| name | text | "Emergency Fund" |
| allocated_cents | integer | Protected amount |

### transactions

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | |
| amount_cents | integer | Total amount |
| type | enum | expense/income/transfer/debt_payment |

### transaction_lines

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| transaction_id | UUID FK | |
| account_id | UUID FK | |
| amount_cents | integer | Signed |

## Enums

- transaction_type: expense/income/transfer/debt_payment/envelope_allocation
- account_type: debit/credit/loan/savings/investment/cash
- line_type: debit/credit

## Indexes

- user_id on all user-scoped tables
- transaction_id on transaction_lines
- date on transactions

## Timestamp Convention

- All timestamp columns store UTC (never local time)
- User-entered dates converted to UTC before storage
- Date/time comparisons and sorting performed in UTC
- Client displays convert UTC to user local timezone
