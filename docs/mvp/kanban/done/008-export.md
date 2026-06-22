# Story: Export

**Status**: Done
**Priority**: P1
**Estimated**: 3 days

## Goal

Implement CSV export for audit (ZIP export is post-MVP).

## Context

- Create `export/README.md` with export strategy
- Create `export/csv-zip.md` with CSV format (ZIP post-MVP)
- Create `export/ledger-csv.md` with ledger CSV format
- Create `export/import-readiness.md` with future import planning

## Acceptance Criteria

- [x] Export transactions to CSV
- [x] CSV format: date, amount, category, note, account
- [x] User can select date range for export
- [x] Export respects user scoping (only own data)

## Post-MVP (Future)

- [ ] Export attachments as ZIP (future - post-MVP)

## Technical Notes

Export is for audit/tax purposes. Not for data portability (that's future).

## Tests Required

- [x] Test CSV export format
- [x] Test user scoping in exports
- [x] Test date range filtering

## Dependencies

- 001-database-model.md
- 003-api-model.md

## Done Checklist

- [x] All acceptance criteria met
- [x] Export functionality tested
