# Offline Writes

Queue and retry strategy for offline writes.

Implementation details: [Offline Retry](./offline-retry.md)

## Write Flow

1. Save to local PGlite (optimistic)
2. Queue write in IndexedDB
3. If online: sync immediately
4. If offline: queue until online

## Sync Queue

```typescript
interface QueuedWrite {
  id: string;
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  data: any;
  status: 'pending' | 'synced' | 'error';
}
```

## Retry Logic

- **Persisted retry queue**: Writes stored in IndexedDB, survive page reload
- **Exponential backoff**: 7 attempts with increasing delay
  - Attempt 1: 1 second
  - Attempt 2: 2 seconds
  - Attempt 3: 4 seconds
  - Attempt 4: 8 seconds
  - Attempt 5: 16 seconds
  - Attempt 6: 32 seconds
  - Attempt 7: 64 seconds (max delay: 1 minute)
- **Error state**: After 7 failed attempts, mark as `error` and stop auto-retry
- **Manual retry**: User can trigger retry from UI
- **Export fallback**: If sync continuously fails, allow export of pending writes

See [Offline Retry](./offline-retry.md) for implementation details.

