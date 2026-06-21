# Sync Model

Electric + TanStack DB Shape API is the official MVP sync path for offline-first LedgerMx.

## Architecture

- **Electric Server**: Manages shape subscriptions, pushes changes
- **TanStack DB Client**: Local PGlite, subscribes to shapes, queues offline writes

## Data Flow

### Online Read

1. Subscribe to shape
2. Electric sends initial data
3. TanStack DB stores in PGlite
4. UI reads from PGlite (fast)

### Online Write

1. Save to PGlite (optimistic)
2. Electric sends to server
3. PostgreSQL persists

### Offline Write

1. Save to PGlite
2. Queue write in IndexedDB
3. When online: retry queue

## Shape Subscriptions

Electric + TanStack DB Shape API is the official MVP sync path. Every shape is scoped by authenticated `user_id` to ensure data isolation between users.

- Subscribe to table with user filter
- Shape definition: table name + where clause (user_id)
- Client receives all matching rows
- Automatic updates via Electric WebSocket

Example shape config:
- Table: `transactions`
- Where: `user_id = currentUser.id`
- Include: related `transaction_lines`

## Sync Status

Sync status must be visible in the UI for MVP. See [Sync Status UI](./sync-status-ui.md) for full documentation.

Required user-visible states:
- **Offline**: No network connection
- **Queued**: Writes pending in IndexedDB queue
- **Syncing**: Actively syncing with server
- **Synced**: All changes synced
- **Conflict**: Conflict requires user resolution (Keep A/Keep B/Keep Both)
- **Error**: Sync error with retry option

Status appears in: global app chrome/status badge, per-record pending/error markers, and conflict resolution panel entry point.

## Configuration

Electric in Docker Compose. Client connects via WebSocket.
