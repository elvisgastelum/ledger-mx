# Seeds

Seed data documentation for LedgerMx MVP.

## Purpose

Seed data for development, testing, and demo.

## Topics

- [Demo](./demo.md) - Demo seed with sample data
- [Personal](./personal.md) - Personal seed with real accounts
- [Coverage](./coverage.md) - Seed coverage requirements

## Seed Types

### Demo Seed

Realistic but fake data for demos and screenshots.

### Personal Seed

User's real accounts and categories for development. **Local-only** - personal seed files must be ignored by git (add to `.gitignore`). Implementation must add appropriate `.gitignore` entries.

### Test Seeds

Minimal data for automated tests.

## Usage

```bash
# Run demo seed
pnpm seed:demo

# Run personal seed
pnpm seed:personal

# Reset database and seed
pnpm db:reset && pnpm seed:demo
```

## Seed Principles

1. **User-scoped**: All seeds include user_id
2. **Resettable**: Can run multiple times
3. **Realistic**: Demo seed looks like real data
4. **Minimal**: Test seeds are minimal

## Tools

Use faker.js for fake data. Use Drizzle seed for insertion.
