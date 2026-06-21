# Ledger and Double-Entry

Every transaction balances (sum of lines = 0). Uses double-entry bookkeeping.

## Transaction Structure

### Header (transactions table)

- `id`, `user_id`, `date`, `note`, `type`
- `type`: income | expense | transfer | adjustment | reversal | debt_payment

### Lines (transaction_lines table)

- `id`, `transaction_id`, `account_id`, `envelope_id`, `category_id`
- `amount_cents`: signed integer (minor units)
- `person_id`, `responsibility_group_id`

## Sign Convention

Store `amount_cents` as **signed integer**:

- **Positive**: value enters/credits the target (money in, income, increases asset)
- **Negative**: value leaves/debits the target (money out, expense, decreases asset)
- All transaction lines must sum to zero

This single-column approach is explicit when reading the sign and avoids a separate `debit_credit` column.

## Examples

### Expense: $100 Groceries

```
Transaction: type=expense
Lines:
  1. account_id: bbva-debit, amount_cents: -10000  (money leaves account)
  2. category_id: groceries, amount_cents: 10000   (expense allocation)
  Sum: 0 ✓
```

### Income: $5000 Paycheck

```
Transaction: type=income
Lines:
  1. account_id: bbva-debit, amount_cents: 500000  (money enters account)
  2. amount_cents: -500000                         (income source)
  Sum: 0 ✓
```

### Transfer: $200 BBVA → Cash

```
Lines:
  1. account_id: bbva-debit, amount_cents: -20000  (money leaves BBVA)
  2. account_id: cash, amount_cents: 20000         (money enters Cash)
  Sum: 0 ✓
```

### Debt Payment: $300 BBVA → Credit Card

```
Lines:
  1. account_id: bbva-debit, amount_cents: -30000        (money leaves account)
  2. account_id: credit-card, amount_cents: 30000       (debt reduced)
  Sum: 0 ✓
```

## Ledger Invariant

Every transaction must satisfy:

1. Sum of all lines' `amount_cents` = 0
2. At least 2 lines per transaction
3. Each line's `amount_cents` must be non-zero

## Credit Card Payment

Debt payment, not expense. Prevents double-counting in reports.
