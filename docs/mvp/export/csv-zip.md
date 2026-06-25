# CSV Export

Export financial data to CSV for external analysis or audit.

## Endpoint

```
GET /export/csv?startDate=2024-01-01&endDate=2024-12-31
Response: CSV file download
```

## Simple Transaction CSV (MVP Export)

Standard export for users. Uses `Amount_Cents` (integer minor units) with explicit `Debit_Credit` column:

```csv
Date,Amount_Cents,Debit_Credit,Account,Envelope,Category,Note,Type
2024-01-15,10050,debit,BBVA Debit,Food,Groceries,Weekly shopping,expense
2024-01-20,500000,credit,BBVA Debit,,Paycheck,Monthly income,income
```

Columns:

- `Date`: YYYY-MM-DD
- `Amount_Cents`: positive integer (cents, minor units)
- `Debit_Credit`: "debit" (money out) or "credit" (money in)
- `Account`: account name
- `Envelope`: envelope name or empty
- `Category`: category name or empty
- `Note`: transaction note
- `Type`: expense | income | transfer | debt_payment

## Audit CSV (Detailed)

Includes all fields for audit trail. Same base columns plus audit metadata:

```csv
Date,Amount_Cents,Debit_Credit,Transaction_ID,Line_ID,Account,Envelope,Category,Person,Note,User_ID
2024-01-15,10050,debit,tx-123,line-456,BBVA Debit,Food,Groceries,,Weekly shopping,user-789
```

Additional columns:

- `Transaction_ID`: unique transaction identifier
- `Line_ID`: double-entry line identifier (empty for MVP single-line export)
- `Person`: person associated with transaction (for debt tracking)
- `User_ID`: user who created the transaction

## Post-MVP

ZIP export with attachments is deferred to post-MVP.

## Testing

- Test CSV output matches expected format
- Test date range filtering
- Test `Debit_Credit` column consistent across all rows
- Test `Amount_Cents` always positive
