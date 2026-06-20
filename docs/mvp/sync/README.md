# Sync Documentation

Electric sync with TanStack DB Shape API for offline-first LedgerMx.

## Files

- [Sync Model](./model.md) - Sync architecture overview
- [Shapes](./shapes.md) - Electric shape subscriptions
- [Offline Writes](./offline-writes.md) - Queue and retry logic
- [Conflicts](./conflicts.md) - Conflict resolution strategy

## Sync Technology

### Electric (Sync Server)
- Real-time sync for PostgreSQL
- Self-hosted alongside API
- Shape-based subscriptions
- User-scoped data

### TanStack DB (Client)
- Local-first database
- Shape API for Electric integration
- Reactive queries
- Offline persistence with PGlite

## Sync Flow

```
┌─────────────┐     Shape API      ┌──────────────┐
│   Electric   │ ◄─────────────────► │  TanStack DB │
│   Server    │    (subscriptions)  │   (Client)   │
└─────┬───────┘                     └──────┬───────┘
      │                                    │
      │ PostgreSQL                         │ PGlite/IndexedDB
      ▼                                    ▼
  ┌─────────┐                         ┌─────────┐
  │ Server  │                         │  Local  │
  │   DB    │                         │   DB    │
  └─────────┘                         └─────────┘
```

## Core Concepts

### Shapes
- Subset of database tables/rows
- User-scoped (where user_id = current user)
- Subscribed via Electric client
- Changes pushed in real-time

### Offline Writes
- Write to local DB (PGlite) immediately
- Queue write for sync
- Retry when online
- No data loss

### Conflicts
- Electric detects conflicts
- Client resolves per user choice
- Options: Keep A, Keep B, Keep Both
- Default: never auto-delete financial records

## MVP Scope

- Electric + TanStack DB Shape API
- User-scoped shapes for all financial data
- Offline write queue with retry
- Visible conflict resolution UI
- No silent data loss

## Future Considerations

- Multiple devices syncing simultaneously
- Partial sync (only recent data)
- Sync progress indicator
- Background sync (when tab closed)
- Sync error recovery
