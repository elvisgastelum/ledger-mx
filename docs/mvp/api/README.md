# API Documentation

REST API for LedgerMx, built with contract-first ts-rest boundaries and OpenAPI generation from contracts (NestJS + PostgreSQL + Drizzle).

## Base URL

- Production: `https://api.ledger-mx.com`
- Development: `http://localhost:3000`

## Authentication

JWT access + refresh tokens. Bearer token in header:
`Authorization: Bearer <access_token>`

## Main Endpoints

### Auth

- `POST /auth/register` - Register
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Revoke session

### Transactions

- `GET /transactions` - List
- `POST /transactions` - Create
- `PUT /transactions/:id` - Update
- `POST /transactions/:id/reverse` - Reverse

### Accounts & Envelopes

- `GET /accounts`, `POST /accounts`
- `GET /envelopes`, `POST /envelopes`

### Reports

- `GET /reports/spendable-balance`
- `GET /reports/expenses-by-category`
- `GET /reports/debt-progress`

### Export

- `GET /export/csv` - Download CSV

### Health

- `GET /health` - Health check

## Response Format

Success: `{ data: {...}, meta: {...} }`
Error (RFC 7807): `{ type, title, status, detail }`

## Related Documentation

- [API Contracts](./contracts.md) - ts-rest contract definitions and rules
- [API Boundaries](./boundaries.md) - Contract-first endpoint design guidelines
- [Authentication](./auth.md) - Auth endpoint contracts and JWT strategy
- [OpenAPI](./openapi.md) - Generating OpenAPI from ts-rest contracts

## Pagination

```json
{
  "data": [...],
  "meta": { "page": 1, "limit": 20, "total": 100 }
}
```
