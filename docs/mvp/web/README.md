# Web Application Documentation

React PWA frontend for LedgerMx.

## Files

- [UX Principles](./ux-principles.md) - Design guidelines
- [Transaction Flow](./transaction-flow.md) - Transaction creation UX
- [Reports](./reports.md) - MVP reports and filters
- [Routes](./routes.md) - TanStack Router routes
- [State/Data Boundaries](./state-data-boundaries.md) - Data flow architecture
- [Calendar](./calendar.md) - Financial calendar feature
- [Wireframes](./wireframes.md) - UI layout documentation

## Tech Stack

- React 18+ with Vite
- TypeScript
- PWA (service worker, offline)
- TanStack Router (type-safe routing)
- TanStack Query (data fetching)
- TanStack DB (local state + sync)
- PGlite/IndexedDB (local SQL)
- Electric (sync client)
- Tailwind CSS + shadcn/ui
- Vitest + Testing Library + Playwright

## Core UX Flow

```
Open App → Tap (+) → Choose template or manual → Save
```

## Key Features

### Offline-First

- Transactions saved to local PGlite immediately
- Sync when online
- No loading spinners for local reads

### Transaction Creation

- Quick templates (Groceries, Gas, etc.)
- Manual entry with full fields
- Default date/time to now (editable)
- Optimistic UI updates

### Spendable Balance

- Real-time calculation
- Visual breakdown (accounts - envelopes - upcoming)
- Prominent display on dashboard

### Financial Calendar

- Income occurrences (biweekly paychecks)
- Recurring charges due dates
- Debt payments scheduled
- Paycheck plans visible

## PWA Features

- Install prompt (iOS, Android, Desktop)
- Offline mode (service worker)
- Background sync (future)
- Push notifications (future)

## Development

```bash
# Start dev server
pnpm --filter @ledger-mx/web dev

# Run tests
pnpm --filter @ledger-mx/web test

# Build for production
pnpm --filter @ledger-mx/web build
```

## Project Structure

```
apps/web/src/
├── components/       # UI components (shadcn/ui based)
├── routes/          # TanStack Router routes
├── hooks/           # Custom React hooks
├── lib/            # Utilities, API client
├── stores/         # State management (TanStack DB)
└── types/          # TypeScript types
```
