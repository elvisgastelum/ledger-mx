# MVP Scope

## In Scope

### Core Financial Features
- Accounts management (BBVA Debit, BBVA Credit, Nu Credit, etc.)
- Envelopes/protected allocations
- Transaction entry (expense, income, transfer, debt payment, envelope allocation)
- Double-entry ledger with transaction lines
- Categories for transactions
- Responsibility groups and people/dependents
- Debt tracking and payoff planning
- Credit card management
- Recurring charges
- Paycheck-based budgets with income rules
- Income projections (biweekly every second Friday)

### Technical Features
- Offline-first architecture with PGlite/IndexedDB
- Electric sync with TanStack DB Shape API
- React PWA with TanStack Router and Query
- NestJS API with PostgreSQL and Drizzle
- REST + OpenAPI documentation
- JWT authentication with refresh tokens
- Session/device management
- CSV export for audit (ZIP post-MVP)
- Financial calendar events
- Reports (spendable balance, expenses by category, debt progress)

### Testing and Quality
- Strict TDD workflow
- Vitest + Testing Library + Playwright
- Testcontainers PostgreSQL for backend tests
- Seed data (demo and personal)
- Ledger invariant tests

## Out of Scope (Future)

- SQLite WASM/OPFS (deferred, using PGlite/IndexedDB)
- Passkey authentication (future)
- Multi-user households
- Investment tracking (CETES, GBM) - future
- Bank account imports
- Mobile native apps
- Multi-currency
- Automated categorization
- Bill pay integration
- Tax filing assistance
- pg_dump rotation backups (future direction)

## MVP Success Criteria

1. User can create transaction offline
2. Sync works without data loss
3. Spendable balance formula correct
4. Paycheck plan allocates to envelopes
5. Debt payoff progress visible
6. CSV export produces audit-ready files
7. All ledger invariants pass tests
8. Offline-to-online transition seamless

## Non-Functional Requirements

- Every transaction balances (double-entry)
- No floating point (integer minor units)
- Client-generated UUID v4
- Soft delete / reversal for corrections
- User-scoped data isolation
- Offline writes queue for later sync
- Conflict resolution visible to user
