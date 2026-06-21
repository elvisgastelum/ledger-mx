# Offline Retry Implementation

Implementation details for offline write retry logic.

Overview: [Offline Writes](./offline-writes.md)

> **Note:** Code examples in this document are API/UX sketches and are not runtime implementation yet.

## Retry Implementation

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

## Error State UI

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
