# Reports API

Planned endpoints for financial reports. All endpoints are defined in the `reports` router of the ts-rest contract (`libs/contracts/src/contract.ts`) and are not yet implemented.

## Endpoints

### GET /api/v1/reports/spendable-balance (Planned)

Get spendable balance for an optional date range.

**Auth Required**: Yes (JWT)
**Query Parameters**:
- `startDate` (optional): ISO 8601 datetime (inclusive start of range)
- `endDate` (optional): ISO 8601 datetime (inclusive end of range)

**Success Response (200)**:
```json
{
  "totalIncome": 500000,
  "totalExpenses": 350000,
  "spendableBalance": 150000
}
```
All values are in cents (integer).

**Error Responses**:
- 401: Unauthorized (invalid/missing JWT)
- 501: Not Implemented

---

### GET /api/v1/reports/expenses-by-category (Planned)

Get expenses grouped by category for a required date range.

**Auth Required**: Yes (JWT)
**Query Parameters**:
- `startDate` (required): ISO 8601 datetime (inclusive start of range)
- `endDate` (required): ISO 8601 datetime (inclusive end of range)

**Success Response (200)**:
```json
[
  {
    "categoryGroupId": "a1b2c3d4-...",
    "categoryGroupName": "Housing",
    "totalExpenses": 150000,
    "percentageOfTotal": 42.86
  }
]
```

**Error Responses**:
- 400: Invalid query parameters
- 401: Unauthorized
- 501: Not Implemented

---

### GET /api/v1/reports/debt-progress (Planned)

Get debt payoff progress for an optional date range.

**Auth Required**: Yes (JWT)
**Query Parameters**:
- `startDate` (optional): ISO 8601 datetime (inclusive start of range)
- `endDate` (optional): ISO 8601 datetime (inclusive end of range)

**Success Response (200)**:
```json
{
  "totalDebt": 2500000,
  "paidDebt": 500000,
  "remainingDebt": 2000000,
  "progressPercentage": 20.0
}
```

**Error Responses**:
- 401: Unauthorized
- 501: Not Implemented

## User Scoping

All report endpoints automatically scope data to the authenticated `user_id` (extracted from JWT). No `userId` query/path parameter is required.

## Implementation Notes

Report logic will reuse existing application use cases for transaction/category group/debt queries. Controllers will map contract inputs to use case inputs and return contract-compliant responses.
