# Export API

CSV/ZIP export for audit.

## Endpoints

### GET /export/csv

Download transactions as CSV.

**Query:** startDate, endDate

**Response:** CSV file download.

### GET /export/csv.zip (Future)

Download all data as ZIP with multiple CSVs.

## CSV Format

```csv
Date,Amount,Category,Note,Account,Envelope,Type
2024-01-15,10050,Groceries,Weekly shopping,BBVA Debit,Food,expense
```

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

Amount in cents. Negative for income. Empty envelope if none.

## Future

- ZIP export with multiple CSVs
- JSON export (preserves double-entry)
- Scheduled exports
