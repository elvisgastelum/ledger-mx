# Ledger and Double-Entry

Every transaction balances (sum of lines = 0). Uses double-entry bookkeeping.

## Transaction Structure

### Header (transactions table)

- `id`, `user_id`, `date`, `note`, `type`
- `type`: expense | income | transfer | debt_payment

### Lines (transaction_lines table)

- `id`, `transaction_id`, `account_id`, `envelope_id`, `category_id`
- `amount_cents`: positive integer (minor units)
- `debit_credit`: "debit" (money out) or "credit" (money in)
- `person_id`, `responsibility_group_id`

## Sign Convention

**Recommended (Explicit):**
- Store `amount_cents` as positive integer
- Use `debit_credit` column to indicate direction
- "debit" = money leaving (expenses, payments)
- "credit" = money entering (income, refunds)

**Alternative (Signed):**
- Store `amount_cents` as signed integer
- Positive = credit (money in)
- Negative = debit (money out)
- Less explicit, more error-prone

Exports and audit logs MUST use explicit `debit_credit` + positive `amount_cents`.

## Examples

### Expense: $100 Groceries

```
Transaction: type=expense
Lines:
  1. account_id: bbva-debit, amount_cents: 10000, debit_credit: debit
  2. category_id: groceries, amount_cents: 10000, debit_credit: credit
  Sum: 0 ✓
```

### Income: $5000 Paycheck

```
Transaction: type=income
Lines:
  1. account_id: bbva-debit, amount_cents: 500000, debit_credit: debit
  2. amount_cents: 500000, debit_credit: credit (income)
  Sum: 0 ✓
```

### Transfer: $200 BBVA → Cash

```
Lines:
  1. account_id: bbva-debit, amount_cents: 20000, debit_credit: debit
  2. account_id: cash, amount_cents: 20000, debit_credit: credit
  Sum: 0 ✓
```

### Debt Payment: $300 BBVA → Credit Card

```
Lines:
  1. account_id: bbva-debit, amount_cents: 30000, debit_credit: debit
  2. debt_id: credit-card, amount_cents: 30000, debit_credit: credit
  Sum: 0 ✓
```

## Ledger Invariant

Every transaction must satisfy:
1. Sum of all lines' effective signed amount = 0
2. At least 2 lines per transaction
3. `amount_cents` positive in storage (if using explicit mode)

## Credit Card Payment

Debt payment, not expense. Prevents double-counting in reports.

