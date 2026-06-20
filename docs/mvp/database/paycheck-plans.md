# Paycheck and Income Planning

## Purpose

Plan allocation of irregular or biweekly income across envelopes and obligations before paycheck arrives.

## Paycheck Plans Table

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Owner (required) |
| name | text | "June 15 Paycheck" |
| expected_date | date | Anticipated arrival |
| expected_amount_cents | integer | Gross or net estimate |
| is_received | boolean | Mark when deposited |
| received_amount_cents | integer | Actual (may differ) |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp | Soft delete |

## Paycheck Allocations Table

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| paycheck_plan_id | uuid | FK to paycheck_plans |
| user_id | uuid | Owner (required) |
| envelope_id | uuid | Target envelope (nullable) |
| account_id | uuid | Target account (nullable) |
| category_id | uuid | For categorization |
| planned_amount_cents | integer | Allocated amount |
| actual_amount_cents | integer | After receipt |
| sort_order | integer | Display order |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp | Soft delete |

## Income Occurrences Table

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Owner (required) |
| name | text | "Main Job", "Freelance" |
| frequency | text | biweekly, monthly, irregular |
| typical_amount_cents | integer | For forecasting |
| next_expected_date | date | |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp | Soft delete |

## Ledger Relationship

- When paycheck received: create `transactions` + `transaction_lines`
- Allocations become envelope transfers
- `user_id` scopes all queries

## Reports

- Income vs planned allocation variance
- Three-paycheck month detection
- Cash flow forecast (next 4 pay periods)
- Effective tax rate tracking

## Tests and Invariants

- `expected_amount_cents > 0`
- `planned_amount_cents > 0`
- Sum allocations <= expected_amount (warning if over)
- `user_id` required on all queries
- Paycheck plans immutable after `is_received = true`
- Soft delete preserves history
