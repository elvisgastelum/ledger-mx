# Export

Export documentation for LedgerMx MVP.

## MVP Export: CSV

- Export transactions to CSV for audit/tax (simple transaction format)
- Export detailed audit CSV with transaction metadata (see [csv-zip.md](./csv-zip.md))
- Export attachments as ZIP (post-MVP)
- User-selectable date range

## Topics

- [CSV Export](./csv-zip.md) - Export format and implementation (ZIP post-MVP)
- [Ledger CSV](./ledger-csv.md) - CSV format specification (simple transaction)
- [Import Readiness](./import-readiness.md) - Future import planning

## Export Use Cases

1. **Tax audit**: Export transactions for CPA
2. **Year-end review**: Export full year CSV
3. **Backup**: Export as personal backup (not data portability)

## MVP Constraints

- CSV only (no Excel)
- No import in MVP (export only)
- No bank integration (future)
- Manual export (no automated/scheduled)

## CSV Format (Simple Transaction)

```csv
Date,Amount_Cents,Debit_Credit,Account,Envelope,Category,Note,Type
2024-01-15,10050,debit,BBVA Debit,Food,Groceries,Weekly shopping,expense
```

**Column order:** Date, Amount_Cents, Debit_Credit, Account, Envelope, Category, Note, Type

Amount_Cents is integer (cents). Debit_Credit: "debit" (out) or "credit" (in).

For detailed audit CSV with Transaction_ID, Line_ID, Person, and User_ID, see [csv-zip.md](./csv-zip.md).

## Future Export

- PDF reports
- Excel format
- Scheduled exports
- Bank import format (OFX, QFX)
