# Story: Ledger Model

**Status**: Doing
**Priority**: P0
**Estimated**: 4 days

## Goal

Implement double-entry ledger with transaction lines.

## Context

- Document ledger invariants in `database/ledger.md`
- Every transaction must have 2+ lines summing to zero
- Credit card payment is debt_payment, not expense
- No duplicate expenses when paying credit card

## Acceptance Criteria

- [ ] Double-entry bookkeeping enforced
- [ ] Transaction lines support multiple accounts
- [ ] Debt payment transfers correctly
- [ ] Ledger invariant tested
- [ ] Examples show expense, income, transfer, debt payment

## Technical Notes

Ledger invariant is critical. Every transaction must balance. Test this invariant in every use case.

## Tests Required

- Test ledger invariant: sum of lines = 0
- Test debt payment transfer correctness
- Test all transaction types

## Dependencies

- 001-database-model.md

## Done Checklist

- [ ] All acceptance criteria met
- [ ] Ledger invariant tests pass
