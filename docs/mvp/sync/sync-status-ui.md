# Sync Status UI

Sync status visibility in the UI for MVP offline-first experience.

Overview: [Sync Model](./model.md)

> **Note:** Code examples in this document are API/UX sketches and are not runtime implementation yet.

## Purpose

Users need clear feedback about sync state: offline/online status, pending writes, conflicts, and errors. Sync status is derived from Electric/TanStack DB signals and the IndexedDB offline write queue.

## User-Visible States

| State      | Description                       | UI Indicator                               |
| ---------- | --------------------------------- | ------------------------------------------ |
| `offline`  | No network connection             | Status badge: "Offline"                    |
| `queued`   | Writes pending in IndexedDB queue | Status badge: "Pending changes" + count    |
| `syncing`  | Actively syncing with server      | Status badge: "Syncing..." (animated)      |
| `synced`   | All changes synced                | Status badge: "Synced" or hidden when idle |
| `conflict` | Conflict requires user resolution | Prominent notification + conflict icon     |
| `error`    | Sync error (non-conflict)         | Error badge with retry action              |

## TypeScript Interface Sketch

```typescript
type SyncState =
  | { status: "offline" }
  | { status: "queued"; pendingCount: number }
  | { status: "syncing" }
  | { status: "synced" }
  | { status: "conflict"; conflictIds: string[] }
  | { status: "error"; message: string; retryable: boolean };

interface SyncStatus {
  state: SyncState;
  lastSyncedAt: Date | null;
  isOnline: boolean;
}
```

## Where Status Appears

1. **Global app chrome / status badge**: Persistent indicator (header/footer) showing overall sync state. Offline/syncing states always visible; synced state may auto-hide after a delay.

2. **Per-record pending/error markers**: Individual records in lists/tables show a subtle indicator (icon + text) when they have pending writes or sync errors.

3. **Conflict resolution panel entry point**: Conflict state includes a "Resolve" button/link that opens the conflict resolution UI ([conflicts-ui.md](./conflicts-ui.md)).

## Accessibility

- All status indicators include **text labels**, not color-only cues.
- Use `aria-live="polite"` on the global status badge so screen readers announce state changes.
- Conflict notifications use `role="alert"` for immediate announcement.
- Pending/syncing states use `aria-busy="true"` where appropriate.

## Derivation from Signals

- **`offline`**: `navigator.onLine === false` or Electric WebSocket disconnected.
- **`queued`**: IndexedDB offline write queue length > 0.
- **`syncing`**: TanStack DB Shape API reports active sync activity.
- **`synced`**: Queue empty, Electric connected, no active sync, no conflicts.
- **`conflict`**: Conflict detected (from [conflicts.md](./conflicts.md)).
- **`error`**: Sync error event from Electric/TanStack DB (non-conflict).

## Acceptance Checklist

- [x] Sync status visible in UI (global badge + per-record markers + conflict entry point)
- [x] All states documented: offline, queued, syncing, synced, conflict, error
- [x] TypeScript interface sketch provided
- [x] Accessibility notes included (text labels, aria-live, role alert)
- [x] Derivation from Electric/TanStack DB/IndexedDB signals documented
