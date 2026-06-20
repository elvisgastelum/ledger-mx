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
export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  amountCents: integer('amount_cents').notNull(),
});
```

## Validation

Use class-validator DTOs:

```typescript
export class CreateTransactionDto {
  @IsUUID() id: string;
  @IsInt() @Min(0) amountCents: number;
}
```

## Development

- `nest start --watch` for hot reload
- Vitest for tests
- Testcontainers for PostgreSQL
