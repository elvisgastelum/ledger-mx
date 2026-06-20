# Offline Writes

Queue and retry strategy for offline writes.

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

### Retry Implementation

```typescript
interface QueuedWrite {
  id: string;
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  data: any;
  status: 'pending' | 'synced' | 'error';
  attempts: number;
  maxAttempts: 7;
  nextRetryAt?: Date;
  lastError?: string;
}

async function processRetryQueue() {
  const pending = await db.queue.findMany({ 
    where: { status: 'pending' } 
  });
  
  for (const write of pending) {
    if (write.attempts >= write.maxAttempts) {
      await db.queue.update(write.id, { status: 'error' });
      continue;
    }
    
    if (write.nextRetryAt && write.nextRetryAt > new Date()) {
      continue; // Not time yet
    }
    
    try {
      await syncWrite(write);
      await db.queue.update(write.id, { status: 'synced' });
    } catch (error) {
      const nextAttempt = write.attempts + 1;
      const delayMs = Math.pow(2, nextAttempt) * 1000; // Exponential backoff
      
      await db.queue.update(write.id, {
        attempts: nextAttempt,
        nextRetryAt: addSeconds(new Date(), delayMs / 1000),
        lastError: error.message,
      });
    }
  }
}
```

### Error State UI

```typescript
function SyncErrorNotification({ write }) {
  return (
    <Alert variant="error">
      <h4>Sync Failed</h4>
      <p>Failed to sync after 7 attempts.</p>
      <p>Last error: {write.lastError}</p>
      <Button onClick={() => retryWrite(write.id)}>Retry Now</Button>
      <Button onClick={() => exportPendingWrite(write)}>Export to File</Button>
    </Alert>
  );
}
```

## UI Feedback

```typescript
function SyncStatus() {
  const pending = useQuery(['syncQueue']);
  return pending.data > 0 ? '⏳ Pending' : '✅ Synced';
}
```

## Online Detection

```typescript
window.addEventListener('online', () => processSyncQueue());
```

## Testing

Test offline write queues and online sync.
