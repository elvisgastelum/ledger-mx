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

**Zod is the mandatory validation library** for all request/response/config validation across the project.

- Joi, class-validator, and class-transformer are **prohibited** for validation purposes.
- Rationale: Zod provides shared schemas/contracts with type-safe validation and better integration with ts-rest contracts in `libs/contracts`.
- Use `nestjs-zod` for NestJS integration with `createZodDto` and `ZodValidationPipe`.

### OpenAPI

OpenAPI/Swagger documentation is generated from ts-rest contracts using `@ts-rest/open-api`, not NestJS Swagger decorators. Swagger UI can still serve the generated document from `apps/api`.

### Path Prefix Caveat

ts-rest's Nest integration ignores Nest global prefixes, versioning, and controller-level prefixes. Use `pathPrefix: '/api/v1'` in the contract definition to model API versioning and base paths.

## Development

- `nest start --watch` for hot reload
- Vitest for tests
- Testcontainers for PostgreSQL integration tests

### Local Database (Docker Compose)

For local development and testing with a real PostgreSQL database:

1. Copy the example environment file to create your local `.env`:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` to adjust ports, credentials, or other settings if needed. **Do not commit `.env` to version control** (it is ignored by `.gitignore`).

2. Manage the database container:
   ```bash
   # Start PostgreSQL container
   pnpm db:up

   # Stop the container (data persists in named volume)
   pnpm db:down

   # Stop and remove container + volume (data lost)
   pnpm db:reset
   ```

**Connection URL:** Configured via `DATABASE_URL` in `.env`, defaulting to `postgresql://postgres:postgres@localhost:5432/ledger_mx_dev` if using the example values.

**Note:** `POSTGRES_PORT` in `.env` is the **host port** mapped to PostgreSQL's internal port 5432. If you change `POSTGRES_PORT`, you must also update the port in `DATABASE_URL` to match. See `.env.example` for details.

The Docker Compose service uses a named volume (`ledger_mx_postgres_data`) for data persistence. Running `pnpm db:reset` removes the volume entirely. The service includes a healthcheck using `pg_isready` to ensure the database is ready before use.

**Important:** Docker Compose will fail with a clear error message if required environment variables (`POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT`) are missing from `.env`. Copy `.env.example` to `.env` before running `pnpm db:up`:
```bash
cp .env.example .env
```

**Note:** Testcontainers (used in integration tests) spins up an isolated PostgreSQL container per test suite and does not require this local database to be running.
