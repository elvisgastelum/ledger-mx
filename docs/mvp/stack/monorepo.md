# Monorepo Setup

pnpm workspaces for LedgerMx MVP.

## Configuration

### pnpm-workspace.yaml

```yaml
packages:
  - "apps/*"
  - "libs/*"
```

### Workspace Names

- `@ledger-mx/api` (apps/api)
- `@ledger-mx/web` (apps/web)
- `@ledger-mx/domain` (libs/domain)
- `@ledger-mx/application` (libs/application)
- `@ledger-mx/database` (libs/database)
- `@ledger-mx/contracts` (libs/contracts)
- `@ledger-mx/sync` (libs/sync)
- `@ledger-mx/ui` (libs/ui)
- `@ledger-mx/testing` (libs/testing)

## Build Order

1. libs/domain
2. libs/contracts, libs/application
3. libs/database, libs/sync
4. libs/ui, libs/testing
5. apps/api, apps/web

## Scripts

```bash
pnpm dev:api        # Start API
pnpm dev:web        # Start Web
pnpm build          # Build all
pnpm test           # Test all
```
