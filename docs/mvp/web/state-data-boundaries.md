# State & Data Boundaries

State management architecture for LedgerMx web app.

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   React Components                    │
├─────────────────────────────────────────────────────┤
│  UI State (Store)  │  Server State (TanStack Query) │
│  - Modal open/close│  - Cached API data             │
│  - Form wizard step│  - Loading/error states         │
│  - Selected filters│  - Mutations                    │
│  - Sidebar collapsed                                │
├─────────────────────────────────────────────────────┤
│              API Client (credentials: include)      │
│                   /api/v1/*                          │
├─────────────────────────────────────────────────────┤
│              User-Scoped Data (user_id)             │
└─────────────────────────────────────────────────────┘
```

## Current Implementation State

**As of now:** The web app has NO TanStack Query QueryClient and NO client-side Store implemented yet.

**Installed TanStack packages (apps/web):**

- `@tanstack/react-query` (server state)
- `@tanstack/react-router` (routing)

**Target state (this document):** Full TanStack Query for server state + client-side state management for UI state, aligned with TanStack Router.

**Note:** The specific store solution for UI state (e.g., React context, Zustand, or a future TanStack Store package) is TBD. This document describes the architectural boundary without prescribing a specific store library.

---

## TanStack Query (Server State)

**Responsibility:** Fetch, cache, and mutate server data (API responses).

### What Goes in TanStack Query

- **Query data:** Transactions, accounts, envelopes, reports (all user-scoped)
- **Loading states:** `isLoading`, `isFetching`
- **Error states:** `isError`, `error`
- **Mutations:** Create, update, delete operations
- **Cache invalidation:** After mutations

### Query Client Setup

```typescript
// apps/web/src/lib/query-client.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
      queryFn: async ({ queryKey }) => {
        // user_id scoping is derived server-side from session cookie
        // userId in queryKey is for client-side cache isolation only
        const [resource] = queryKey as [string, Record<string, unknown>];
        return apiFetch(`/${resource}`, {
          method: "GET",
          // credentials: 'include' sends session cookie; user_id extracted server-side
        });
      },
    },
    mutations: {
      retry: 0,
    },
  },
});
```

### Query Keys (User-Scoped)

All query keys include `userId` to ensure proper cache isolation:

```typescript
// Pattern: ['resource', { userId, ...filters }]
const transactionKeys = {
  all: (userId: string) => ["transactions", { userId }],
  list: (userId: string, filters?: TransactionFilters) => [
    "transactions",
    { userId, ...filters },
  ],
  detail: (userId: string, id: string) => ["transactions", { userId, id }],
};

const accountKeys = {
  all: (userId: string) => ["accounts", { userId }],
};

const envelopeKeys = {
  all: (userId: string) => ["envelopes", { userId }],
};
```

### Fetching Data

```typescript
// apps/web/src/hooks/use-transactions.ts
import { useQuery } from "@tanstack/react-query";

export function useTransactions(filters?: TransactionFilters) {
  const { userId } = useAuth(); // From TanStack Router context

  return useQuery({
    queryKey: transactionKeys.list(userId, filters),
    queryFn: () =>
      apiFetch("/transactions", {
        method: "GET",
        // credentials: 'include' is default in apiFetch
      }),
    enabled: !!userId, // Don't fetch if not authenticated
  });
}
```

### Mutations

```typescript
// apps/web/src/hooks/use-create-transaction.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: (data: CreateTransactionInput) =>
      apiFetch("/transactions", {
        method: "POST",
        body: JSON.stringify(data),
        // credentials: 'include' is default in apiFetch
      }),
    onSuccess: () => {
      // Invalidate transactions cache for this user
      queryClient.invalidateQueries({
        queryKey: transactionKeys.all(userId),
      });
    },
    onError: (error) => {
      // Show error toast
      toast.error("Failed to create transaction");
    },
  });
}
```

### Cache Invalidation Patterns

```typescript
// After creating a transaction, invalidate:
onSuccess: () => {
  // Invalidate transaction list
  queryClient.invalidateQueries({
    queryKey: transactionKeys.all(userId),
  });
  // Invalidate account balances (affected by transaction)
  queryClient.invalidateQueries({
    queryKey: accountKeys.all(userId),
  });
  // Invalidate envelope balances (if envelope allocation)
  queryClient.invalidateQueries({
    queryKey: envelopeKeys.all(userId),
  });
};
```

---

## Client-Side UI State (Boundary Definition)

**Responsibility:** Client-side UI state that is NOT fetched from server.

**Note:** The specific library for UI state management is not yet determined. Options include React context, Zustand, or a future TanStack Store package. This section defines what belongs in UI state, regardless of implementation.

### What Goes in UI State (Client-Side)

- **Modal/toggle state:** `transactionFormOpen`, `sidebarOpen`
- **Wizard steps:** `onboardingStep`, `importWizardStep`
- **Transient UI state:** `selectedAccountId` (for filter), `selectedDateRange`
- **Form state NOT managed by React Hook Form:** (React Hook Form handles form state)
- **Theme:** `darkMode` (future)
- **Sidebar:** `sidebarCollapsed`

### Example Implementation (React Context - TBD)

```typescript
// apps/web/src/contexts/app-state.tsx
import { createContext, useContext, useState, useCallback } from 'react';

interface AppState {
  transactionFormOpen: boolean;
  sidebarCollapsed: boolean;
  selectedAccountFilter: string | null;
}

interface AppStateContextValue {
  state: AppState;
  openTransactionForm: () => void;
  closeTransactionForm: () => void;
  toggleSidebar: () => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    transactionFormOpen: false,
    sidebarCollapsed: false,
    selectedAccountFilter: null,
  });

  const openTransactionForm = useCallback(() => {
    setState((prev) => ({ ...prev, transactionFormOpen: true }));
  }, []);

  const closeTransactionForm = useCallback(() => {
    setState((prev) => ({ ...prev, transactionFormOpen: false }));
  }, []);

  const toggleSidebar = useCallback(() => {
    setState((prev) => ({ ...prev, sidebarCollapsed: !prev.sidebarCollapsed }));
  }, []);

  return (
    <AppStateContext.Provider value={{
      state,
      openTransactionForm,
      closeTransactionForm,
      toggleSidebar,
    }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}
```

### Using UI State in Components

```typescript
// apps/web/src/components/transaction-form-trigger.tsx
import { useAppState } from '@/contexts/app-state';

export function TransactionFormTrigger() {
  const { state, openTransactionForm } = useAppState();

  return (
    <>
      <Button onClick={openTransactionForm}>+</Button>
      {state.transactionFormOpen && <TransactionForm onClose={closeTransactionForm} />}
    </>
  );
}
```

---

## API Client (Authenticated Requests)

All API calls use `credentials: 'include'` to send HTTP-only cookies:

```typescript
// apps/web/src/lib/api-client.ts
const BASE_URL = "/api/v1"; // All routes under /api/v1

export async function apiFetch(path: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    credentials: "include", // Send session cookie
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    if (response.status === 401) {
      // Redirect to login
      window.location.href = "/login";
      throw new AuthError("Unauthenticated");
    }

    if (response.status === 403) {
      throw new ForbiddenError("User not authorized");
    }

    throw new ApiError(response.status, error);
  }

  return response.json();
}
```

**User scoping:** The `user_id` is extracted from the session/token on the server side (API). It is NOT passed as a request parameter. All controllers enforce `WHERE user_id = $1`.

---

## Data Boundaries Summary

| Concern                                  | Belongs In                       |
| ---------------------------------------- | -------------------------------- |
| Transaction list (fetched from API)      | TanStack Query                   |
| Account balances (fetched from API)      | TanStack Query                   |
| Transaction form fields (during editing) | React Hook Form state            |
| Transaction form open/close              | UI State (client-side)           |
| Onboarding wizard step                   | UI State (client-side)           |
| Selected filter values (transient)       | UI State (client-side)           |
| Loading state for API fetch              | TanStack Query (`isLoading`)     |
| Error state for API fetch                | TanStack Query (`isError`)       |
| Success toast after mutation             | Component state or toast library |

---

## Offline State (Future)

When offline:

- Mutations queue in TanStack Query's mutation cache
- UI shows "Pending sync" indicator
- On reconnect, mutations retry automatically
- Conflicts resolved server-side (last-write-wins with server timestamp)

---

## Local-First Architecture (Future)

```
Local PGlite (source of truth)
    ↓
TanStack Query cache (in-memory)
    ↓
Sync to API (background)
```

- Read from PGlite (local)
- Write to PGlite (optimistic)
- Sync to API in background
- On sync conflict: server wins (with notification)
