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

| Column | Type        | Notes            |
| ------ | ----------- | ---------------- |
| id     | UUID PK     | Client-generated |
| email  | text UNIQUE | Login            |

### accounts

| Column        | Type    | Notes                          |
| ------------- | ------- | ------------------------------ |
| id            | UUID PK |                                |
| user_id       | UUID FK | user scoping                   |
| name          | text    | "BBVA Debit"                   |
| type          | enum    | debit/credit/loan/savings/cash |
| balance_cents | integer | Current balance                |

### envelopes

| Column          | Type    | Notes            |
| --------------- | ------- | ---------------- |
| id              | UUID PK |                  |
| user_id         | UUID FK |                  |
| name            | text    | "Emergency Fund" |
| allocated_cents | integer | Protected amount |

### transactions

| Column                     | Type    | Notes                                |
| -------------------------- | ------- | ------------------------------------ |
| id                         | UUID PK |                                      |
| user_id                    | UUID FK |                                      |
| amount_cents               | integer | Total amount                         |
| type                       | enum    | income/expense/transfer/adjustment/reversal/debt_payment  |
| reversal_of_transaction_id | UUID FK | Nullable, self-referencing           |

**FK Decision — `reversal_of_transaction_id`:** The default `ON DELETE NO ACTION` is kept intentionally for MVP. Transaction history must not be hard-deleted; reversal links should remain referentially intact. Corrections, reversals, and soft-delete policies are preferred over deleting posted transactions. If a future physical-delete workflow is introduced, revisit whether `ON DELETE SET NULL` is safer.

### transaction_lines

| Column         | Type    | Notes                                        |
| -------------- | ------- | -------------------------------------------- |
| id             | UUID PK |                                              |
| transaction_id | UUID FK |                                              |
| account_id     | UUID FK |                                              |
| envelope_id    | UUID FK | Optional                                     |
| category_id    | UUID FK | Optional                                     |
| target_type    | enum    | account/envelope/category                    |
| target_id      | UUID    | References target_type entity                |
| amount_cents   | integer | Signed (positive = credit, negative = debit) |

### Double-Entry Pattern

`transaction_lines` implements the ledger double-entry pattern: `transactions` is the transaction/header table while `transaction_lines` contains the individual ledger entries. Each transaction must have at least two lines, and the `amount_cents` values across all lines for a transaction must sum to zero. All rows remain user-scoped via the parent `transactions.user_id`.

## Enums

| Enum Name                       | Values                                                      |
| ------------------------------- | ----------------------------------------------------------- |
| transaction_type                | income/expense/transfer/adjustment/reversal/debt_payment    |
| account_type                    | debit/credit/loan/savings/cash                              |
| transaction_line_target_type    | account/envelope/category                                   |

## Indexes

- user_id on all user-scoped tables
- transaction_id on transaction_lines
- date on transactions

## Timestamp Convention

- All timestamp columns store UTC (never local time)
- User-entered dates converted to UTC before storage
- Date/time comparisons and sorting performed in UTC
- Client displays convert UTC to user local timezone
