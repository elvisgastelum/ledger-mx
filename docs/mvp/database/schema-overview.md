# Schema Overview

## Entity Relationship (Simplified)

```
users (1) ─── (N) accounts
users (1) ─── (N) envelopes
users (1) ─── (N) transactions
users (1) ─── (N) categories
users (1) ─── (N) category_groups
users (1) ─── (N) sessions
users (1) ─── (N) auth_audit_logs
transactions (1) ─── (N) transaction_lines
```

**Note**: `category_groups` is separate from `responsibility_groups`. See `category-groups.md` and `responsibility-groups.md` for distinction.

## Key Tables

### users

| Column        | Type        | Notes                                                    |
| ------------- | ----------- | -------------------------------------------------------- |
| id            | UUID PK     | Client-generated                                         |
| email         | text UNIQUE | Login                                                    |
| password_hash | text        | Nullable; local password hash when password auth enabled |

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

| Column                     | Type    | Notes                                                    |
| -------------------------- | ------- | -------------------------------------------------------- |
| id                         | UUID PK |                                                          |
| user_id                    | UUID FK |                                                          |
| amount_cents               | integer | Total amount                                             |
| type                       | enum    | income/expense/transfer/adjustment/reversal/debt_payment |
| reversal_of_transaction_id | UUID FK | Nullable, self-referencing                               |

**FK Decision — `reversal_of_transaction_id`:** The default `ON DELETE NO ACTION` is kept intentionally for MVP. Transaction history must not be hard-deleted; reversal links should remain referentially intact. Corrections, reversals, and soft-delete policies are preferred over deleting posted transactions. If a future physical-delete workflow is introduced, revisit whether `ON DELETE SET NULL` is safer.

### categories

| Column            | Type        | Notes                                |
| ----------------- | ----------- | ------------------------------------ |
| id                | UUID PK     |                                      |
| user_id           | UUID FK     | User scoping                         |
| name              | text        | "Groceries"                          |
| category_group_id | UUID FK     | Required; links to `category_groups` |
| parent_id         | UUID FK     | Optional; subcategory hierarchy      |
| deleted_at        | timestamptz | Nullable; soft delete                |

**Note**: Optional responsibility-related columns (`responsibility_group_id`) are documented separately in `responsibility-groups.md`.

### category_groups

| Column                        | Type        | Notes                              |
| ----------------------------- | ----------- | ---------------------------------- |
| id                            | UUID PK     |                                    |
| user_id                       | UUID FK     | User scoping                       |
| name                          | text        | "Need", "Want", "Savings"          |
| kind                          | enum        | income/expense/savings/general     |
| ideal_percentage_basis_points | integer     | Nullable; 5000 = 50%               |
| sort_order                    | integer     | Display order                      |
| is_system                     | boolean     | Default groups, not user-deletable |
| created_at                    | timestamptz |                                    |
| updated_at                    | timestamptz |                                    |
| deleted_at                    | timestamptz | Nullable; soft delete              |

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

**Note**: Optional responsibility-related columns (`responsibility_group_id`, `person_id`) are documented separately in `responsibility-groups.md`.

### sessions

| Column             | Type        | Notes                                      |
| ------------------ | ----------- | ------------------------------------------ |
| id                 | UUID PK     |                                            |
| user_id            | UUID FK     | User scoping                               |
| refresh_token_hash | text        | Hashed refresh token (never raw)           |
| device_name        | text        | Optional device identifier                 |
| ip_address         | text        | Last known IP                              |
| user_agent         | text        | Last known user agent                      |
| last_active_at     | timestamptz | Last activity timestamp (app-maintained)   |
| expires_at         | timestamptz | Session expiry                             |
| revoked_at         | timestamptz | Nullable, set on logout/invalidate         |
| created_at         | timestamptz |                                            |
| updated_at         | timestamptz | App-maintained on refresh/session rotation |

**Note:** `last_active_at` and `updated_at` on the sessions table are maintained by the application layer when session activity or refresh rotation occurs. MVP does not use DB triggers for these columns.

### auth_audit_logs

| Column     | Type        | Notes                                   |
| ---------- | ----------- | --------------------------------------- |
| id         | UUID PK     |                                         |
| user_id    | UUID FK     | Nullable (allows failed login attempts) |
| event_type | text        | e.g., login, logout, token_refresh      |
| ip_address | text        | Request IP                              |
| user_agent | text        | Request user agent                      |
| metadata   | jsonb       | Additional event context                |
| created_at | timestamptz |                                         |

### Double-Entry Pattern

`transaction_lines` implements the ledger double-entry pattern: `transactions` is the transaction/header table while `transaction_lines` contains the individual ledger entries. Each transaction must have at least two lines, and the `amount_cents` values across all lines for a transaction must sum to zero. All rows remain user-scoped via the parent `transactions.user_id`.

## Enums

| Enum Name                    | Values                                                   |
| ---------------------------- | -------------------------------------------------------- |
| transaction_type             | income/expense/transfer/adjustment/reversal/debt_payment |
| account_type                 | debit/credit/loan/savings/cash                           |
| transaction_line_target_type | account/envelope/category                                |

## Indexes

- user_id on all user-scoped tables
- transaction_id on transaction_lines
- date on transactions
- refresh_token_hash on sessions
- expires_at on sessions
- revoked_at on sessions
- event_type on auth_audit_logs
- created_at on auth_audit_logs

## Timestamp Convention

- All timestamp columns store UTC (never local time)
- User-entered dates converted to UTC before storage
- Date/time comparisons and sorting performed in UTC
- Client displays convert UTC to user local timezone
