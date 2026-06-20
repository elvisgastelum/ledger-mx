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

```typescript
@Get('export/csv')
async exportCsv(@Query() dto: ExportDto, @Request() req) {
  const txs = await this.transactionService.findByDateRange(
    req.user.userId, dto.startDate, dto.endDate
  );
  
  const csv = this.csvService.generate(txs);
  
  res.header('Content-Type', 'text/csv');
  res.attachment(`ledger-mx-${dto.startDate}-${dto.endDate}.csv`);
  res.send(csv);
}
```

## CSV Generation

Amount in cents (integer minor units). Always positive. Use `Debit_Credit` column for direction.

**Column order:** Date, Amount_Cents, Debit_Credit, Account, Envelope, Category, Note, Type

## Future

- ZIP export with multiple CSVs (post-MVP)
- JSON export (preserves double-entry)
- Scheduled exports
