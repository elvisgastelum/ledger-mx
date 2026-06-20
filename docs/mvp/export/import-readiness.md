# Import Readiness (Future)

## MVP Status

Import is **not implemented**. Future work.

## Future Import Strategy

### Bank Imports

Import transactions from bank exports:

- OFX (Open Financial Exchange)
- QFX (Quicken Financial Exchange)
- CSV (bank-specific format)

### Manual Import

User uploads file → Map columns → Preview → Import.

### Duplicate Detection

Match on:
- Date
- Amount
- Description

### Import Endpoint (Future)

```
POST /api/import/csv
Body: { file: File, mapping: ColumnMapping }
```

## Data Portability

### Export Format for Re-import

Use JSON to preserve double-entry:

```json
{
  "transactions": [
    {
      "id": "uuid",
      "date": "2024-01-15",
      "amountCents": 10050,
      "lines": [...]
    }
  ]
}
```

## MVP Workaround

Manual transaction entry. No import.

## TODO

- [ ] Support OFX/QFX import
- [ ] Support CSV import with column mapping
- [ ] Duplicate detection
- [ ] Import preview UI
- [ ] JSON export for data portability
