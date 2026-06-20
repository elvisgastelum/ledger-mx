# Story: Export

**Status**: Todo
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

- [ ] Export transactions to CSV
- [ ] CSV format: date, amount, category, note, account
- [ ] User can select date range for export
- [ ] Export respects user scoping (only own data)

## Post-MVP (Future)

- [ ] Export attachments as ZIP (future - post-MVP)

## Technical Notes

Export is for audit/tax purposes. Not for data portability (that's future).

## Tests Required

- Test CSV export format
- Test user scoping in exports
- Test date range filtering

## Dependencies

- 001-database-model.md
- 003-api-model.md

## Done Checklist

- [ ] All acceptance criteria met
- [ ] Export functionality tested
