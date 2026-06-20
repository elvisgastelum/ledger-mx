# Export

Export documentation for LedgerMx MVP.

## MVP Export: CSV/ZIP

- Export transactions to CSV for audit/tax
- Export attachments as ZIP (future)
- User-selectable date range

## Topics

- [CSV/ZIP](./csv-zip.md) - Export format and implementation
- [Ledger CSV](./ledger-csv.md) - CSV format specification
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

## CSV Format

```csv
Date,Amount,Category,Note,Account,Envelope
2024-01-15,100.50,Groceries,Weekly shopping,BBVA Debit,Food
```

## Future Export

- PDF reports
- Excel format
- Scheduled exports
- Bank import format (OFX, QFX)
