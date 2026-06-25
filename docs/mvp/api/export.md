# Export API

Planned endpoint for CSV data export. The endpoint is defined in the `export` router of the ts-rest contract (`libs/contracts/src/contract.ts`) and is not yet implemented.

## Endpoints

### GET /api/v1/export/csv (Planned)

Download filtered financial data as a CSV file.

**Auth Required**: Yes (JWT)
**Query Parameters**:

- `startDate` (optional): ISO 8601 datetime (inclusive start of range)
- `endDate` (optional): ISO 8601 datetime (inclusive end of range)
- `type` (required): Enum of `transactions`, `category-groups`, `reports` (type of data to export)

**Success Response (200)**:

- Content-Type: `text/csv`
- Body: CSV file content (string)

**Error Responses**:

- 400: Invalid query parameters
- 401: Unauthorized (invalid/missing JWT)
- 501: Not Implemented

---

## CSV Format (Transactions)

Planned default format for `type=transactions` exports:

```csv
Date,Amount_Cents,Debit_Credit,Account,Envelope,Category,Note,Type
2024-01-15,10050,debit,BBVA Debit,Food,Groceries,Weekly shopping,expense
```

### Rules

- Amounts are in cents (integer, always positive)
- `Debit_Credit` column indicates transaction direction
- Column order is fixed as above

## Implementation Notes

- CSV generation will use a dedicated `ExportService` in the application layer.
- Controllers will map contract query parameters to service inputs and return the CSV string with the correct `Content-Type` header.
- `@ts-rest/core` `c.otherResponse` is used in the contract to define the non-JSON CSV response type.

## Future

- ZIP export with multiple CSVs (post-MVP)
- JSON export (preserves double-entry)
- Scheduled recurring exports
