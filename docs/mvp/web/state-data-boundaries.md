# State & Data Boundaries

## State Management

LedgerMx uses TanStack Query + Store.

## TanStack Query

### Server State

```typescript
// Fetch transactions
const { data, isLoading } = useQuery({
  queryKey: ['transactions'],
  queryFn: () => api.getTransactions(),
});
```

### Mutations

```typescript
const mutation = useMutation({
  mutationFn: api.createTransaction,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  },
});
```

## TanStack Store

### UI State

```typescript
// apps/web/src/store.ts
import { createStore } from '@tanstack/store';

const store = createStore({
  transactionFormOpen: false,
  selectedAccountId: null,
});
```

## Data Boundaries

### Local First

Read from PGlite (local). Write to PGlite (optimistic). Sync in background.

### Query Keys

```
['transactions', { userId }]
['accounts', { userId }]
['envelopes', { userId }]
```

### Cache Invalidation

Invalidate on mutations:

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['transactions'] });
}
```

## Offline State

When offline, mutations queue in TanStack DB. UI shows pending indicator.
