# CSV/ZIP Export

Export financial data to CSV for external analysis or audit.

## CSV Export

### Endpoint
```
POST /api/export/csv
Body: { startDate: "2024-01-01", endDate: "2024-12-31" }
Response: CSV file download
```

### CSV Format (Standard Export)

Uses explicit `debit_credit` column + positive `amount_cents`:

```csv
Date,Amount_Cents,Debit_Credit,Category,Note,Account,Envelope,Type
2024-01-15,10050,debit,Groceries,Weekly shopping,BBVA Debit,Food,expense
2024-01-20,500000,credit,Paycheck,Monthly income,BBVA Debit,,income
```

Columns:
- `Date`: YYYY-MM-DD
- `Amount_Cents`: positive integer (minor units)
- `Debit_Credit`: "debit" (money out) or "credit" (money in)
- `Category`: category name or empty
- `Note`: transaction note
- `Account`: account name
- `Envelope`: envelope name or empty
- `Type`: expense | income | transfer | debt_payment

### Alternative: Signed Amount (Optional)

For compatibility, optionally support signed amount:
- Positive = money in (income, refund)
- Negative = money out (expense, payment)

If using signed format, column name must be `Signed_Amount_Cents` (not `Amount`).

## Audit CSV Export

Includes all fields for audit trail:

```csv
Date,Amount_Cents,Debit_Credit,Transaction_ID,Line_ID,Account,Envelope,Category,Person,Note,User_ID
2024-01-15,10050,debit,tx-123,line-456,BBVA Debit,Food,Groceries,,Weekly shopping,user-789
```

Required for audit:
- `Amount_Cents`: always positive
- `Debit_Credit`: explicit debit/credit
- `Transaction_ID`: links all lines of a transaction
- `Line_ID`: unique per line

## ZIP Export (Future)

Attachments (receipts, invoices) exported as ZIP.

## Testing

- Test CSV output matches expected format
- Test date range filtering
- Test `debit_credit` column consistent across all rows
- Test `amount_cents` always positive in audit export
