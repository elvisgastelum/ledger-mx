# Frontend Stack

## Framework: React + Vite + PWA

### Core Stack

- **React 18+**: UI library
- **Vite**: Build tool (fast HMR, native ESM)
- **TypeScript**: Type safety
- **PWA**: Service worker, offline capability

### Routing: TanStack Router

- Type-safe routes
- File-based routing (optional)
- Search params validation
- Nested layouts

```typescript
// routes.ts
import { createRouter } from "@tanstack/react-router";

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});
```

### Data Fetching: TanStack Query

- Caching and synchronization
- Background refetching
- Optimistic updates
- Error handling

```typescript
// Fetch transactions
const { data, isLoading } = useQuery({
  queryKey: ["transactions"],
  queryFn: () => api.transactions.list(),
});
```

### API Client: ts-rest + TanStack Query

Web consumes shared ts-rest contracts from `libs/contracts` using `@ts-rest/react-query/v5` and `initTsrReactQuery()`. TanStack Query remains the server-state cache layer; ts-rest handles type-safe request/response contract enforcement.

ts-rest does not replace offline-first local persistence (TanStack DB/PGlite) or Electric sync; it only manages the transport-layer API contract between client and server.

### Local State: TanStack DB

- Local-first database with PGlite
- Shape API for Electric sync
- Reactive queries
- Offline persistence

```typescript
// TanStack DB with PGlite
import { createDb } from "@tanstack/db";
import { pgLite } from "@tanstack/db-adapter-pglite";

const db = createDb({
  adapter: pgLite({ dataDir: "idb://ledger-mx" }),
});
```

### UI: Tailwind CSS + shadcn/ui

- Utility-first CSS (Tailwind)
- Pre-built components (shadcn/ui)
- Accessible by default
- Customizable with Tailwind config

```typescript
import { Button } from '@/components/ui/button';

<Button variant="default">Add Transaction</Button>
```

### Sync: Electric Client

- Real-time sync with server
- Shape-based subscriptions
- Offline write queue
- Conflict resolution

```typescript
// Subscribe to transaction shapes
const shape = db.shape({
  table: "transactions",
  where: { user_id: userId },
});
```

## PWA Features

- Service worker for offline
- App manifest for install
- Background sync (future)
- Push notifications (future)

## Development

- Vite dev server with HMR
- ESLint + Prettier
- Vitest for unit tests
- Testing Library for components
- Playwright for E2E

## Build Output

- Static files to `dist/`
- Service worker generated
- Ready for any static host
