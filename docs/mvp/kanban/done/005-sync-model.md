# Story: Sync Model

**Status**: Done
**Priority**: P1
**Estimated**: 5 days

## Goal

Document Electric + TanStack DB Shape API as the official MVP sync path for offline-first LedgerMx.

## Context

- Created `sync/model.md` with sync architecture (updated to explicitly state official MVP sync path)
- Created `sync/shapes.md` with shape definitions
- Created `sync/offline-writes.md` with offline queue
- Created `sync/conflicts.md` with conflict resolution options
- Created `sync/conflicts-ui.md` with conflict resolution UI implementation
- Created `sync/offline-retry.md` with retry logic for failed syncs
- Created `sync/sync-status-ui.md` with sync status visibility in UI (new)
- Updated `sync/README.md` with complete file list and official MVP sync path statement

## Acceptance Criteria

- [x] Electric + TanStack DB Shape API documented as official MVP sync path (in model.md, README.md)
- [x] Shapes scoped to user_id (documented in model.md, shapes.md)
- [x] Offline writes queue in IndexedDB (documented in offline-writes.md)
- [x] Conflict resolution: Keep A/Keep B/Keep Both (never auto-delete) (documented in conflicts.md, conflicts-ui.md)
- [x] Sync status visible in UI (documented in sync-status-ui.md, referenced in model.md)

## Technical Notes

Documentation completed for the official MVP sync path using Electric + TanStack DB Shape API. All sync documentation is in `docs/mvp/sync/`. Key documents:

- `model.md`: Architecture overview with explicit official MVP sync path statement and user_id scoping
- `shapes.md`: Shape subscriptions scoped to authenticated user_id
- `offline-writes.md`: IndexedDB queue for offline writes
- `conflicts.md` and `conflicts-ui.md`: Keep A/Keep B/Keep Both resolution, never auto-delete
- `offline-retry.md`: Retry logic for failed syncs
- `sync-status-ui.md` (new): Sync status visibility with states (offline, queued, syncing, synced, conflict, error), TypeScript interface sketch, UI locations, accessibility notes, and signal derivation

## Tests Required

> **Deferred:** This story is documentation-only (sync model/API sketches). Runtime tests belong to later implementation stories (sync client integration, offline queue, conflict handling). No runtime tests are required at this docs-only checkpoint.

## Dependencies

- 001-database-model.md
- 004-auth-session-model.md

## Done Checklist

- [x] All acceptance criteria met and documented
- [x] Sync status UI documented with all required states
- [x] Official MVP sync path explicitly stated in model.md and README.md
- [x] Story moved from `todo/` to `done/`
- [x] Kanban README updated (005 moved from TODO to DONE index)
