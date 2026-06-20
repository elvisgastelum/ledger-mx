# Story: Sync Model

**Status**: Todo
**Priority**: P1
**Estimated**: 5 days

## Goal

Implement Electric + TanStack DB Shape API for offline-first sync.

## Context

- Create `sync/model.md` with sync architecture
- Create `sync/shapes.md` with shape definitions
- Create `sync/offline-writes.md` with offline queue
- Create `sync/conflicts.md` with conflict resolution options

## Acceptance Criteria

- [ ] Electric + TanStack DB Shape API documented as official MVP sync path
- [ ] Shapes scoped to user_id
- [ ] Offline writes queue in IndexedDB
- [ ] Conflict resolution: Keep A/Keep B/Keep Both (never auto-delete)
- [ ] Sync status visible in UI

## Technical Notes

PGlite/IndexedDB is MVP direction. SQLite WASM/OPFS is deferred.

## Tests Required

- Test offline write queue
- Test sync conflict resolution
- Test shape scoping to user_id

## Dependencies

- 001-database-model.md
- 004-auth-session-model.md

## Done Checklist

- [ ] All acceptance criteria met
- [ ] Sync tested offline and online
