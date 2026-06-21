# Database Documentation

Database schema, migrations, and financial rules for LedgerMx.

## Files

- [Schema Overview](./schema-overview.md) - Tables and relationships
- [User Scope](./user-scope.md) - Multi-user data isolation
- [Accounts and Envelopes](./accounts-envelopes.md) - Account/envelope model
- [Ledger](./ledger.md) - Double-entry transactions
- [Responsibility Groups](./responsibility-groups.md) - Groups and people (spending by person)
- [Category Groups](./category-groups.md) - Category classification (Need/Want/Savings)
- [Debts and Recurring](./debts-recurring.md) - Debt tracking, recurring charges
- [Paycheck Plans](./paycheck-plans.md) - Income allocation planning
- [Financial Rules](./financial-rules.md) - Business logic in DB
- [Migrations](./migrations.md) - Drizzle migration strategy

## Database Technology

### Server: PostgreSQL 16+
- Primary database
- Electric sync source
- Drizzle ORM for queries

### Local: PGlite/IndexedDB
- Browser-based PostgreSQL
- Same schema as server
- Offline-first storage

## Core Schema Entities

### User and Auth
- `users` - User accounts
- `sessions` - Active sessions
- `audit_log` - Mutation tracking

### Financial Core
- `accounts` - Bank accounts, credit cards, loans
- `envelopes` - Protected allocations
- `transactions` - Transaction headers
- `transaction_lines` - Double-entry lines
- `categories` - Transaction categories

### Planning and Debt
- `debts` - Debt tracking
- `recurring_charges` - Recurring payments
- `paycheck_plans` - Income allocation plans
- `income_occurrences` - Scheduled income
- `financial_calendar_events` - Calendar items

### People and Groups
- `responsibility_groups` - Budget groups (spending by person/group)
- `people` - Dependents
- `category_groups` - Category classification (Need/Want/Savings for budget planning)

## Key Rules

### User Scoping
- Every financial table has `user_id`
- Row-level security or app-level filtering
- Electric shapes user-scoped

### Double-Entry Ledger
- Every transaction has 2+ lines
- Lines sum to zero
- Stored as `transaction_lines`

### No Floats
- All money: `amount_cents` integer
- No decimal columns
- No floating point in app

### Soft Deletes
- `deleted_at` timestamp
- Reversals for corrections
- Audit trail preserved

### UTC Time
- All timestamps stored as UTC in database
- Client/local timezone conversion only for display
- User-entered dates converted to UTC before storage/transmission
- All date/time comparisons in UTC

## Drizzle ORM

### Schema Definition
- Define schemas in `libs/database/drizzle/schema/`
- Each table in separate file
- Export all tables from `index.ts`
- Use `pgTable`, `uuid`, `integer`, `text`, `timestamp`

### Type Safety
- Drizzle infers TypeScript types from schema
- Use `InferSelectModel` and `InferInsertModel`
- No manual type definitions needed

### Query Pattern
- Use Drizzle query builder
- Avoid raw SQL (use only when necessary)
- Transactions for multi-table writes

## Migrations

- Drizzle Kit for migrations
- Push for development
- SQL files for production
- Testcontainers for migration tests
