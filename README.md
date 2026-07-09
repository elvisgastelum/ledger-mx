# Ledger MX

Ledger MX is a personal finance / ledger application built as a TypeScript monorepo.

## Tech stack

- **Package manager:** pnpm `9.15.0`
- **Runtime/tooling:** Node.js 22 via `devenv`
- **Web app:** React + Vite
- **API:** NestJS
- **Database:** PostgreSQL + Drizzle
- **Workspace:** pnpm monorepo

## Repository structure

```txt
apps/
  api/      NestJS API
  web/      React + Vite web app

libs/
  application/
  contracts/
  database/
  domain/
  infrastructure/
  sync/
  testing/
  ui/

docs/
  mvp/      MVP architecture, database, testing, and product docs
```

## Prerequisites

You can develop this project either with `devenv` or with local Node.js, pnpm, Docker, and PostgreSQL.

Recommended setup:

- [Nix](https://nixos.org/)
- [devenv](https://devenv.sh/)
- Docker, if using the Docker-based database commands

Install `devenv` if needed:

```sh
nix-env --install --attr devenv -f https://github.com/NixOS/nixpkgs/tarball/nixpkgs-unstable
```

Or with Nix profiles:

```sh
nix profile install nixpkgs#devenv
```

## Getting started with devenv

Enter the development shell:

```sh
devenv shell
```

The project's `devenv.nix` enables JavaScript tooling, pnpm, Node.js 22, and PostgreSQL support.

Install dependencies:

```sh
pnpm install
```

If you want to start services managed by `devenv`, run:

```sh
devenv up
```

To stop devenv-managed background processes:

```sh
devenv processes down
```

Useful devenv commands:

```sh
devenv shell      # enter the dev environment
devenv up         # start configured processes/services
devenv test       # build/check the dev environment
devenv update     # update pinned devenv inputs
devenv info       # show environment information
```

## Environment variables

Copy the example environment file:

```sh
cp .env.example .env
```

Important variables include:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `VITE_API_BASE_URL`
- `CORS_ORIGIN`

Make sure `DATABASE_URL` matches the PostgreSQL variables, especially the port.

## Database setup

Start the local PostgreSQL database:

```sh
pnpm db:up
```

Run migrations:

```sh
pnpm db:migrate
```

Seed demo data:

```sh
pnpm db:seed:demo
```

Verify seed data:

```sh
pnpm db:seed:verify
```

Stop the database:

```sh
pnpm db:down
```

Reset the database:

```sh
pnpm db:reset
```

The Docker database uses `docker-compose.dev.yml` and PostgreSQL 16.

## Development

Start the full development stack:

```sh
pnpm dev
```

This runs:

```sh
pnpm db:up
pnpm --parallel --filter @ledger-mx/api --filter @ledger-mx/web dev
```

Run only the web app:

```sh
pnpm --filter @ledger-mx/web dev
```

Run only the API:

```sh
pnpm --filter @ledger-mx/api dev
```

## Common commands

Build all packages:

```sh
pnpm build
```

Typecheck all packages:

```sh
pnpm typecheck
```

Lint:

```sh
pnpm lint
```

Format files:

```sh
pnpm format
```

Check formatting:

```sh
pnpm format:check
```

Run tests:

```sh
pnpm test
```

Run web tests:

```sh
pnpm test:web
```

Run end-to-end tests:

```sh
pnpm test:e2e
```

## Architecture notes

High-level boundaries:

```txt
apps/web, apps/api
        ↓
libs/application
        ↓
libs/domain
```

Important project rules:

- Domain and application code must not import API contracts or `ts-rest`.
- API routes live under `/api/v1`.
- Financial data must be scoped by `user_id`.
- Money values use integer cents only.
- Transaction lines must sum to zero.
- Use UUID v4 client-generated IDs.
- Use UTC timestamps internally.
- Avoid hard deletes for synced or cleared financial records; use reversals/corrections.

## Frontend form rule

Forms in `apps/web/src` should use `react-hook-form`.

Use:

- `useForm`
- `register`
- `handleSubmit`
- `formState.errors`
- `formState.isSubmitting`

Avoid managing form field state with `useState`.

## Documentation

Useful project docs:

- `docs/mvp/README.md`
- `docs/mvp/database-ops.md`
- `docs/mvp/stack/README.md`
- `docs/mvp/stack/monorepo.md`
- `docs/mvp/stack/backend.md`
- `docs/mvp/database/README.md`
- `docs/mvp/testing/README.md`
- `docs/mvp/web/README.md`
- `docs/mvp/architecture/README.md`

## Troubleshooting

### `pnpm db:up` fails

Make sure `.env` exists:

```sh
cp .env.example .env
```

Then check that the PostgreSQL variables are set and that `POSTGRES_PORT` is free.

### Database URL mismatch

Ensure `DATABASE_URL` uses the same database name, user, password, and port as the `POSTGRES_*` variables.

### devenv or Nix is rate-limited by GitHub

Configure a GitHub token in `~/.config/nix/nix.conf`:

```txt
access-tokens = github.com=<GITHUB_TOKEN>
```
