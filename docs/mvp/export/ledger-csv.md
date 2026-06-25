# Ledger CSV Format

## Specification

CSV format for LedgerMx export (simple transaction CSV).

**Note**: For detailed audit CSV with transaction metadata, see [csv-zip.md](./csv-zip.md).

## Columns

| Column       | Type       | Description                                |
| ------------ | ---------- | ------------------------------------------ |
| Date         | YYYY-MM-DD | Transaction date                           |
| Amount_Cents | integer    | Amount in cents (always positive)          |
| Debit_Credit | string     | "debit" (money out) or "credit" (money in) |
| Account      | string     | Account name                               |
| Envelope     | string     | Envelope name (optional)                   |
| Category     | string     | Category name (optional)                   |
| Note         | string     | Transaction note                           |
| Type         | enum       | expense/income/transfer/debt_payment       |

## Example

```csv
Date,Amount_Cents,Debit_Credit,Account,Envelope,Category,Note,Type
2024-01-15,10050,debit,BBVA Debit,Food,Groceries,Weekly shopping,expense
2024-01-20,500000,credit,BBVA Debit,,Paycheck,Monthly income,income
2024-01-25,30000,debit,BBVA Debit,,Credit Card Payment,Paying off BBVA Credit,debt_payment
```

## Parsing Rules

1. Amount_Cents is in cents (divide by 100 for display)
2. Debit_Credit: "debit" = money out, "credit" = money in
3. Amount_Cents always positive (sign encoded in Debit_Credit)
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
