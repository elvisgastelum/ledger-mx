# Story: Offline Sync Scope Decision

**Status**: Todo
**Priority**: P0
**Estimated**: 1 day (decision) + follow-up implementation

## Goal

Make a documented decision on offline sync implementation for MVP: either implement offline sync or formally re-scope documentation and acceptance criteria to exclude it.

## Context

- Offline sync was originally scoped in 005-sync-model.md
- MVP timeline may not allow full offline sync implementation
- Decision needed: implement now, defer to post-MVP, or scope down
- If implementing: PGlite/TanStack DB/Electric/offline queue/conflict validation required
- If deferring: update MVP scope docs and acceptance criteria to remove offline requirements
- 012-mvp-validation.md currently lists offline sync as validation requirement

## Acceptance Criteria

### Decision Phase (1 day)
- [ ] Document reviewed: current offline sync architecture (005-sync-model.md)
- [ ] Options evaluated: implement vs defer vs scope down
- [ ] Decision documented with rationale (technical + business)
- [ ] Decision approved by team

### If Implementing (follow-up cards)
- [ ] PGlite or TanStack DB integrated for local storage
- [ ] Offline queue for pending mutations
- [ ] Conflict validation/resolution strategy
- [ ] Sync endpoint for batched changes
- [ ] Offline/online transition handling

### If Deferring (documentation updates)
- [ ] Update `docs/mvp/product/mvp-scope.md` to remove offline sync
- [ ] Update 012-mvp-validation.md acceptance criteria
- [ ] Create post-MVP story for offline sync
- [ ] Communicate decision to stakeholders

## Technical Notes

Options:
1. **Implement Full Offline Sync** (3-5 days additional)
   - PGlite for local SQLite
   - TanStack DB for reactive queries
   - ElectricSQL for sync (or custom solution)
   - Offline queue with conflict resolution

2. **Scope Down to "Offline Read"** (1-2 days)
   - Cache data locally with TanStack Query
   - Allow read-only offline access
   - Queue mutations for when online

3. **Defer to Post-MVP** (0 days now)
   - Remove from MVP scope
   - Document as Phase 2 feature
   - Keep architecture ready for future

Decision factors:
- MVP timeline constraints
- User value of offline capability
- Technical complexity and risk
- Test coverage implications

Files/modules to update based on decision:
- `docs/mvp/product/mvp-scope.md`
- `docs/mvp/architecture/sync.md`
- `012-mvp-validation.md`
- Potential: `packages/infra/src/sync/`, `apps/web/src/sync/`

## Tests Required

### If Implementing
- [ ] Unit tests: offline queue operations
- [ ] Unit tests: conflict resolution logic
- [ ] Integration tests: sync endpoint
- [ ] E2E tests: offline->online transition
- [ ] E2E tests: data consistency after sync

### If Deferring
- [ ] Update existing tests to remove offline assumptions
- [ ] Verify online-only flows work correctly

## Dependencies

- 005-sync-model.md (existing architecture)
- 012-mvp-validation.md (validation criteria to update)

## Done Checklist

### Decision Phase
- [ ] Decision document created: `docs/mvp/decisions/024-offline-sync-decision.md`
- [ ] Decision logged with pros/cons and rationale
- [ ] Follow-up implementation cards created (if implementing)
- [ ] MVP scope updated (if deferring)

### Final (either path)
- [ ] 012-mvp-validation.md updated to match decision
- [ ] Team aligned on scope
- [ ] No ambiguity about offline sync in MVP
