# Database Operations (MVP Local Setup)

Quick reference for local PostgreSQL database setup, migrations, and seed data management.

## Prerequisites

- Docker installed and running
- Node.js and pnpm installed
- Copy `.env.example` to `.env` (required for all commands)

## First-Time Setup (Fresh Clone)

```bash
# 1. Copy environment variables
cp .env.example .env

# 2. Install dependencies
pnpm install

# 3. Start PostgreSQL container
pnpm db:up

# 4. Apply migrations
pnpm db:migrate

# 5. Load demo seed data
pnpm db:seed:demo

# 6. Verify seed data integrity
pnpm db:seed:verify
```

After these steps, the local database is ready for development.

## Migration Commands

### `pnpm db:generate`

Generate migration files from schema changes.

- **When to use:** After modifying `libs/database/src/schema/**` files
- **Output:** New SQL file in `libs/database/drizzle/migrations/`
- **Required before:** Committing schema changes

```bash
pnpm db:generate
```

### `pnpm db:migrate`

Apply pending migrations to the database.

- **When to use:** Normal local development, MVP validation, CI
- **Safe for:** Shared databases, committed validation
- **Recommended:** Default choice for applying schema changes

```bash
pnpm db:migrate
```

### `pnpm db:push`

Push schema changes directly to database (no migration files).

- **When to use:** Disposable local DB prototyping only
- **NOT for:** Committed validation, shared databases, CI
- **Warning:** Changes are not tracked as migration files

```bash
pnpm db:push
```

## Seed Data Commands

### `pnpm db:seed:demo`

Load demo seed data (realistic transactions, accounts, categories).

- **Use case:** Development, MVP demonstration
- **Idempotent:** Safe to run multiple times

```bash
pnpm db:seed:demo
```

### `pnpm db:seed:personal`

Load personal seed data (customized to your finances).

- **Use case:** Personal local development
- **Note:** Requires `SEED_PERSONAL_*` env vars (see `docs/mvp/seeds/personal.md`)

```bash
pnpm db:seed:personal
```

### `pnpm db:seed:verify`

Verify seed data integrity (checks counts, invariants, balances).

- **Run after:** Any seed command
- **CI:** Included in validation pipeline

```bash
pnpm db:seed:verify
```

### `pnpm db:seed:reset`

Reset/Destroy seed data.

- **Requires explicit confirmation:** `SEED_ALLOW_RESET=true`
- **Destructive:** Removes seeded data
- **Safety:** Never runs automatically; always requires env flag

```bash
SEED_ALLOW_RESET=true pnpm db:seed:reset
```

**Warning:** This command is destructive. Only use in local development, never in production.

## Database Lifecycle

### Start/Stop/Reset

```bash
# Start PostgreSQL container
pnpm db:up

# Stop and remove container (preserves data)
pnpm db:down

# Stop and remove container + volumes (destroys data)
pnpm db:reset
```

### Full Reset Workflow

```bash
# 1. Stop and destroy data
pnpm db:reset

# 2. Start fresh container
pnpm db:up

# 3. Apply migrations
pnpm db:migrate

# 4. Re-seed
pnpm db:seed:demo
pnpm db:seed:verify
```

## Required Environment Variables

Minimum `.env` for database operations:

```bash
# PostgreSQL (required by Drizzle and app)
POSTGRES_DB=ledger_mx_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432

# Full connection URL (must match POSTGRES_* values)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ledger_mx_dev
```

**Important:** `DATABASE_URL` must match `POSTGRES_*` values, especially `POSTGRES_PORT`. Drizzle Kit, the app, and seed scripts all use `DATABASE_URL`.

## Troubleshooting

### "DATABASE_URL environment variable is required"

- Ensure `.env` exists (copy from `.env.example`)
- Check that `POSTGRES_*` and `DATABASE_URL` are set
- Verify no syntax errors in `.env`

### Migration fails with connection error

- Ensure `pnpm db:up` has been run
- Check `POSTGRES_PORT` matches `DATABASE_URL` port
- Verify Docker is running: `docker ps`

### Seed verification fails

- Run `pnpm db:migrate` to ensure schema is up-to-date
- Check seed data was loaded: `pnpm db:seed:demo`
- Review specific errors in verification output

## Related Docs

- [Database README](../database/README.md) - Schema overview
- [Migrations](../database/migrations.md) - Drizzle migration strategy
- [Seeds README](../seeds/README.md) - Seed data documentation
- [Personal Seeds](../seeds/personal.md) - Personal seed configuration
