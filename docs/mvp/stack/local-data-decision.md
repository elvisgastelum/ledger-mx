# Local Data Decision

## Decision: PGlite/IndexedDB for MVP

MVP uses PGlite (PostgreSQL in browser via IndexedDB).

## Why PGlite?

1. PostgreSQL-compatible API
2. IndexedDB storage (broad browser support)
3. Drizzle ORM support
4. TanStack DB adapter available

## Implementation

```typescript
const db = createDb({
  adapter: pgLite({ dataDir: 'idb://ledger-mx' }),
});
```

## Offline-First Flow

1. Save to PGlite (optimistic)
2. Queue write for sync
3. When online: sync to Electric
4. Electric replicates to PostgreSQL

## SQLite WASM/OPFS Deferred

Future consideration. PGlite/IndexedDB is MVP direction.

## Constraints

- IndexedDB storage limits (50MB+)
- PGlite is newer, monitor for bugs
- Test on slow devices

## Storage Quota Handling

### QuotaExceededError Detection

```typescript
try {
  await db.transaction.save(data);
} catch (error) {
  if (error.name === 'QuotaExceededError' || error.code === 22) {
    await handleStorageFull();
  }
}
```

### Storage Estimation

Use `navigator.storage.estimate()` to monitor usage:

```typescript
async function checkStorage() {
  const estimate = await navigator.storage.estimate();
  const usageRatio = estimate.usage / estimate.quota;
  
  if (usageRatio > 0.8) {
    // Warning at 80% usage
    showStorageWarning(estimate);
  }
  
  return { usage: estimate.usage, quota: estimate.quota, ratio: usageRatio };
}
```

### Warning Threshold

- **80%**: Show warning banner "Storage almost full (X MB free)"
- **90%**: Disable new attachments/files, allow transaction entry
- **95%**: Read-only mode, force export

### Export/Cleanup UX

```typescript
function StorageWarning({ usage, quota }) {
  const freeMB = (quota - usage) / 1024 / 1024;
  
  return (
    <Alert variant="warning">
      <h4>Storage Almost Full</h4>
      <p>{freeMB.toFixed(1)} MB remaining</p>
      <Button onClick={() => exportData()}>Export Data</Button>
      <Button onClick={() => cleanupOldAttachments()}>Clean Up</Button>
    </Alert>
  );
}
```

Recommended cleanup options:
1. Export full backup (ZIP)
2. Delete old attachments (> 1 year)
3. Compress/archive old transactions (future)
4. Clear sync queue history
