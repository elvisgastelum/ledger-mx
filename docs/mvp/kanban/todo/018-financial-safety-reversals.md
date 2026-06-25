# Story: Financial Safety - Reversals & No Hard Deletes

**Status**: Todo
**Priority**: P0
**Estimated**: 2 days

## Goal

Enforce financial safety by eliminating hard deletes for financial records and implementing proper reversal/correction patterns.

## Context

- Current system may allow hard deletes on financial records (transactions, transaction lines)
- Financial integrity requires audit trail via reversals/corrections, not deletion
- Transaction detail audit trail must be preserved for compliance and debugging
- Transaction repository needs save safety mechanisms to prevent accidental data loss

## Acceptance Criteria

- [ ] No hard deletes allowed on financial records (transactions, transaction lines, accounts)
- [ ] Reversal transaction pattern implemented (negative of original transaction)
- [ ] Correction transaction pattern implemented for fixing errors
- [ ] Transaction detail audit trail preserved (created_at, updated_at, corrected_by, reversed_by)
- [ ] Transaction repository save method validates no-delete constraint
- [ ] Soft delete or status-based archival for non-financial entities (categories, etc.)

## Technical Notes

- Add `reversal_of_id` and `correction_of_id` fields to transactions table
- Implement repository-level guard against DELETE operations on financial tables
- Create service method `createReversal(transactionId)` that generates offsetting transaction
- Create service method `createCorrection(transactionId, corrections)` for fixing errors
- Use transaction status enum: `active`, `reversed`, `corrected`, `archived`

Files/modules to touch:
- `packages/infra/src/database/repositories/transaction.repository.ts`
- `packages/domain/src/transaction/transaction.entity.ts`
- `packages/application/src/transaction/transaction.service.ts`
- `apps/api/src/transaction/transaction.controller.ts`

## Tests Required

- [ ] Unit tests: reversal creates offsetting transaction lines summing to zero
- [ ] Unit tests: correction maintains ledger invariants
- [ ] Unit tests: repository save rejects hard deletes
- [ ] Integration tests: audit trail preserved through corrections/reversals
- [ ] E2E tests: API rejects DELETE requests on financial endpoints
- [ ] Balance recalculation after reversal/correction

## Dependencies

- 017-accounts-transactions-foundation.md

## Done Checklist

- [ ] All acceptance criteria met
- [ ] No hard delete paths exist in financial repositories
- [ ] Reversal/correction UI hooks available (not necessarily full UI)
- [ ] Tests pass with 100% coverage on financial safety methods
- [ ] Documentation updated in `docs/mvp/architecture/` if needed
