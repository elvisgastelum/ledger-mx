# Story: Export

**Status**: Todo
**Priority**: P1
**Estimated**: 3 days

## Goal

Implement CSV/ZIP export for audit.

## Context

- Create `export/README.md` with export strategy
- Create `export/csv-zip.md` with CSV/ZIP format
- Create `export/ledger-csv.md` with ledger CSV format
- Create `export/import-readiness.md` with future import planning

## Acceptance Criteria

- [ ] Export transactions to CSV
- [ ] Export attachments as ZIP
- [ ] CSV format: date, amount, category, note, account
- [ ] User can select date range for export
- [ ] Export respects user scoping (only own data)

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
