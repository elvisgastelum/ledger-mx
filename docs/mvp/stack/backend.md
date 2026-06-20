# Backend Stack

NestJS + PostgreSQL + Drizzle ORM.

## Core Stack

- **NestJS**: Framework
- **PostgreSQL**: Database
- **Drizzle ORM**: Type-safe queries
- **Electric**: Sync server
- **JWT**: Authentication

## Module Structure

```
apps/api/src/
├── auth/           # JWT, refresh tokens
├── transactions/   # Transaction CRUD
├── accounts/       # Account management
├── sync/          # Electric integration
└── common/        # Guards, decorators
```

## Authentication

```typescript
@UseGuards(JwtAuthGuard)
@Get('transactions')
findAll() { ... }
```

## Drizzle Schema

```typescript
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  amountCents: integer("amount_cents").notNull(),
});
```

## API Contracts

API contracts are defined in `libs/contracts` using ts-rest and Zod schemas. Backend controllers implement these contracts using `@ts-rest/nest` handlers.

### Contract Implementation

Controllers use `@TsRestHandler()` or `tsRestHandler()` to implement contract-defined endpoints. Controllers map transport-layer contract inputs to application use case inputs; ts-rest is never imported in `libs/application` or `libs/domain`.

### Validation

Request/response validation is handled by Zod schemas defined in `libs/contracts`, replacing class-validator DTOs.

### OpenAPI

OpenAPI/Swagger documentation is generated from ts-rest contracts using `@ts-rest/open-api`, not NestJS Swagger decorators. Swagger UI can still serve the generated document from `apps/api`.

### Path Prefix Caveat

ts-rest's Nest integration ignores Nest global prefixes, versioning, and controller-level prefixes. Use `pathPrefix: '/api/v1'` in the contract definition to model API versioning and base paths.

## Development

- `nest start --watch` for hot reload
- Vitest for tests
- Testcontainers for PostgreSQL
