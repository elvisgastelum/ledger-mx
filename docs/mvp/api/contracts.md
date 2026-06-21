# API Contracts

Canonical ts-rest API boundary definitions for LedgerMx MVP.

## Purpose

Define type-safe, contract-first API shapes shared between `apps/api` and `apps/web`, replacing ad-hoc DTOs and manual OpenAPI decorators. Contracts are the single source of truth for API request/response formats, endpoint paths, and validation rules.

## Technology

- `@ts-rest/core`: `initContract()`, `c.router()` to define contract routers
- Zod: Runtime schema validation (preferred), compatible with Standard Schema validators
- `@ts-rest/nest`: Backend contract implementation
- `@ts-rest/react-query/v5`: Frontend client with TanStack Query integration
- `@ts-rest/open-api`: OpenAPI generation from contracts

## Package Layout

`libs/contracts/src/` structure:

```
libs/contracts/src/
├── index.ts                 # Export all contracts, schemas, types
├── contract.ts              # Root contract combining all routers
├── common/
│   ├── errors.ts            # Shared RFC 7807 error schemas
│   ├── pagination.ts        # Pagination query/response schemas
│   ├── money.ts             # Money (amountCents) Zod schema
│   └── ids.ts               # UUID v4 ID Zod schema
├── auth/
│   ├── contract.ts          # Auth router (register, login, refresh, logout, current session)
│   └── schemas.ts           # Auth request/response Zod schemas
├── accounts/
│   ├── contract.ts          # Accounts router
│   └── schemas.ts           # Account Zod schemas
└── transactions/
    ├── contract.ts          # Transactions router
    └── schemas.ts           # Transaction Zod schemas
```

## Rules

1. **Transport only**: Contracts define API transport shapes, not domain behavior or business logic
2. **Schema conventions**:
   - Money: Integer `amountCents` (no floats)
   - Percentages: Integer `basisPoints` (no floats; 5000 = 50%)
   - IDs: UUID v4 strings
   - All routes: User-scoped (validate user ownership of resources)
   - Transaction APIs: Preserve double-entry invariants where possible
3. **No forbidden imports**: Contracts must not import from `libs/domain`, `libs/application`, NestJS, React, Drizzle, or application services
4. **Standard Schema**: Use Zod for schemas; ts-rest supports all Standard Schema compatible validators
5. **Path prefix**: Use `pathPrefix: '/api/v1'` in root contract to model API versioning (ts-rest ignores Nest global prefixes)

## Onboarding Router (Implemented)

### Endpoints
```
POST   /api/v1/onboarding/layout (create default groups by layout type)
```

### Request Schema
```typescript
const ApplyLayoutRequestSchema = z.object({
  layout: z.enum(['blank', '50-30-20']),
});
```

### Response Schema
```typescript
const ApplyLayoutResponseSchema = z.object({
  categoryGroups: z.array(OnboardingCategoryGroupSchema),
  created: z.boolean(),
});
```

### Layout Types
- `blank`: Creates single "General" group (kind: general, percentage: null, isSystem: true)
- `50-30-20`: Creates Need (5000bp), Want (3000bp), Savings (2000bp) groups

### Behavior
- If no active category groups exist for user: creates default groups (201/200 with created=true)
- If system groups matching layout already exist: returns them idempotently (200 with created=false)
- If existing groups conflict with requested layout: returns 409 Conflict
- All operations scoped by authenticated user's `user_id`

## Future: Category Groups Contracts

Planned API endpoints for category groups feature:

### Category Groups Router
```
GET    /api/v1/category-groups
POST   /api/v1/category-groups
PUT    /api/v1/category-groups/:id
DELETE /api/v1/category-groups/:id (soft delete)
```

### Categories Router Updates
```
PUT    /api/v1/categories/:id (add required categoryGroupId field)
```

### Onboarding Router
```
POST   /api/v1/onboarding/layout (create default groups by layout type)
GET    /api/v1/onboarding/layout-options (list available layouts)
```

### Zod Schema Conventions (Future)
- `categoryGroupSchema`: id, userId, name, kind (enum), idealPercentageBasisPoints (nullable), sortOrder, isSystem, timestamps, deletedAt
- `createCategoryGroupSchema`: omit system fields (id, timestamps, isSystem)
- `layoutTypeSchema`: enum `blank | 50-30-20`
- All percentage fields use `z.number().int().nullable()` for basis points

## Versioning

API versioning is handled via the contract `pathPrefix` (e.g., `/api/v1`). Breaking changes require a new path prefix version; non-breaking changes update the OpenAPI version metadata.

## Backend Implementation

`apps/api` controllers implement contracts using `@ts-rest/nest`:

- Use `@TsRestHandler(contract)` or `tsRestHandler()` to handle contract-defined endpoints
- Map contract inputs to application use case inputs; never import ts-rest into `libs/application` or `libs/domain`

## Frontend Consumption

`apps/web` consumes contracts using `@ts-rest/react-query/v5`:

- Initialize client with `initTsrReactQuery(contract)`
- TanStack Query remains the server-state cache layer; ts-rest enforces contract types

## OpenAPI Generation

Generate OpenAPI 3.0 from contracts using `@ts-rest/open-api`:

```typescript
import { generateOpenApi } from "@ts-rest/open-api";
import { contract } from "libs/contracts";

const document = generateOpenApi(contract, {
  info: { title: "LedgerMx API", version: "1.0" },
});
```
