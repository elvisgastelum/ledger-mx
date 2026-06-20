# Debts and Recurring Charges

## Purpose

Track debts (credit cards, loans) and recurring charges for payoff planning and cash flow forecasting.

## Debts Table (Planning Level)

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Owner (required) |
| name | text | "Visa", "Car Loan" |
| debt_type | text | credit_card, loan, line_of_credit |
| principal_cents | integer | Current balance |
| interest_rate_bps | integer | Annual APR in basis points |
| min_payment_cents | integer | Minimum monthly payment |
| due_day | integer | Day of month (1-31) |
| payoff_goal_date | date | Optional target |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp | Soft delete |

## Recurring Charges Table

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Owner (required) |
| name | text | "Netflix", "Electric" |
| amount_cents | integer | Fixed or average |
| frequency | text | monthly, biweekly, yearly |
| next_due_date | date | For upcoming display |
| category_id | uuid | Links to categories |
| auto_pay | boolean | Deducts automatically |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp | Soft delete |

## Ledger Relationship

- Debt payments: `transaction_lines` link to `debt_id`
- Recurring charges: Generate `transactions` via scheduled job
- Both reference `user_id` for scoping

## Reports

- Debt payoff timeline (Amortization schedule)
- Total monthly obligations
- Interest vs principal breakdown
- Recurring charges by category

## Tests and Invariants

- `principal_cents >= 0`
- `interest_rate_bps >= 0`
- `min_payment_cents >= 0`
- `due_day BETWEEN 1 AND 31`
- Recurring `amount_cents > 0`
- `user_id` required on all queries
- Soft delete preserves history
