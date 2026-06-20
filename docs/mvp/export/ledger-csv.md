# Ledger CSV Format

## Specification

CSV format for LedgerMx export.

## Columns

| Column | Type | Description |
|--------|------|-------------|
| Date | YYYY-MM-DD | Transaction date |
| Amount | integer | Amount in cents (negative for income) |
| Category | string | Category name |
| Note | string | Transaction note |
| Account | string | Account name |
| Envelope | string | Envelope name (optional) |
| Type | enum | expense/income/transfer/debt_payment |

## Example

```csv
Date,Amount,Category,Note,Account,Envelope,Type
2024-01-15,10050,Groceries,Weekly shopping,BBVA Debit,Food,expense
2024-01-20,-500000,Paycheck,Monthly income,BBVA Debit,,income
2024-01-25,30000,Credit Card Payment,Paying off BBVA Credit,BBVA Debit,,debt_payment
```

## Parsing Rules

1. Amount is in cents (divide by 100 for display)
2. Negative amount = money in (income)
3. Positive amount = money out (expense)
4. Empty envelope = no envelope allocation
5. Date format: ISO 8601 (YYYY-MM-DD)

## Double-Entry Preservation

CSV is single-line per transaction (simplified). Double-entry lines are in `transaction_lines` table (not exported).

For full double-entry export, use API JSON export (future).

## Compatibility

- Opens in Excel, Google Sheets
- Compatible with accounting software (import feature future)
- UTF-8 encoded

## Future

- JSON export (preserves double-entry)
- OFX/QFX export (bank import format)
- Split transaction export (future)
