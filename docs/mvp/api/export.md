# Export API

CSV export for audit (ZIP post-MVP).

## Endpoints

### GET /export/csv

Download transactions as CSV (simple transaction format).

**Query:** startDate, endDate

**Response:** CSV file download.

**CSV Format (Simple Transaction):**

```csv
Date,Amount_Cents,Debit_Credit,Account,Envelope,Category,Note,Type
2024-01-15,10050,debit,BBVA Debit,Food,Groceries,Weekly shopping,expense
```

For detailed audit CSV format, see [csv-zip.md](../export/csv-zip.md).

### GET /export/csv.zip (Future)

Download all data as ZIP with multiple CSVs.

## Implementation

Define the export endpoint contract in `libs/contracts` using ts-rest with Zod schemas for query parameters. Implement the handler in `apps/api` using `@ts-rest/nest`, mapping to application use cases while preserving authorization and user scope:

```typescript
// apps/api/src/export/export.controller.ts
@TsRestHandler(contract.export.csv)
async exportCsv(@User() user: UserEntity) {
  return this.exportService.generateCsv(user.id, this.query);
}
```

## CSV Generation

Amount in cents (integer minor units). Always positive. Use `Debit_Credit` column for direction.

**Column order:** Date, Amount_Cents, Debit_Credit, Account, Envelope, Category, Note, Type

## Future

- ZIP export with multiple CSVs (post-MVP)
- JSON export (preserves double-entry)
- Scheduled exports
