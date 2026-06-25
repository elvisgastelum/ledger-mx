# Story: Transaction Lifecycle UX

**Status**: Todo
**Priority**: P1
**Estimated**: 2 days

## Goal

Implement transaction detail view, correction/reversal UI, filtering/pagination, account/category/envelope interactions, and proper query invalidation.

## Context

- Users need to view transaction details (full page or modal)
- Correction and reversal UI needed for financial safety (see 018)
- Transaction list needs filtering (date, category, account, amount) and pagination
- Transactions interact with accounts, categories, and envelopes
- Query invalidation must refresh related data after mutations

## Acceptance Criteria

- [ ] Transaction detail route/page (view single transaction)
- [ ] Transaction detail displays: date, amount, accounts, categories, envelopes, notes
- [ ] Correction UI: form to correct transaction details
- [ ] Reversal UI: button to reverse entire transaction
- [ ] Filtering on transaction list: date range, category, account, envelope, amount range
- [ ] Pagination on transaction list (server-side or client-side)
- [ ] Account transactions: view all transactions for a specific account
- [ ] Category transactions: view all transactions for a category
- [ ] Envelope transactions: view all transactions for an envelope
- [ ] Query invalidation: related data refreshes after transaction mutations
- [ ] Optimistic updates for better UX

## Technical Notes

Transaction detail page:
- Route: `/transactions/:id`
- Displays all transaction lines (split transactions)
- Shows correction/reversal history
- Actions: edit, correct, reverse, delete (with confirmation)

Filtering strategy:
```typescript
interface TransactionFilters {
  startDate?: Date;
  endDate?: Date;
  categoryId?: string[];
  accountId?: string[];
  envelopeId?: string[];
  minAmount?: number;
  maxAmount?: number;
  search?: string; // notes/payee
}
```

Pagination:
- Server-side pagination for performance
- Page size: 50 transactions
- Infinite scroll or page controls

Query invalidation:
```typescript
// After transaction mutation
queryClient.invalidateQueries({ queryKey: ['transactions'] });
queryClient.invalidateQueries({ queryKey: ['accounts', 'balances'] });
queryClient.invalidateQueries({ queryKey: ['envelopes', 'balances'] });
queryClient.invalidateQueries({ queryKey: ['reports'] });
```

Files/modules to touch:
- `apps/web/src/transaction/components/TransactionDetail.tsx`
- `apps/web/src/transaction/components/TransactionCorrectionForm.tsx`
- `apps/web/src/transaction/components/TransactionReversalConfirm.tsx`
- `apps/web/src/transaction/components/TransactionFilters.tsx`
- `apps/web/src/transaction/components/TransactionList.tsx`
- `apps/web/src/transaction/hooks/useTransactions.ts`
- `apps/web/src/routes/transaction.tsx` (detail route)

## Tests Required

- [ ] Component tests: transaction detail renders correctly
- [ ] Component tests: correction form validation
- [ ] Component tests: reversal confirmation dialog
- [ ] Component tests: filter interactions
- [ ] Component tests: pagination controls
- [ ] E2E tests: transaction detail navigation
- [ ] E2E tests: correction flow end-to-end
- [ ] E2E tests: reversal flow end-to-end
- [ ] E2E tests: filtering reduces results correctly
- [ ] E2E tests: query invalidation refreshes data

## Dependencies

- 017-accounts-transactions-foundation.md
- 018-financial-safety-reversals.md (for correction/reversal UI)

## Done Checklist

- [ ] All acceptance criteria met
- [ ] Transaction detail page functional
- [ ] Correction and reversal UI tested end-to-end
- [ ] Filtering works on all specified fields
- [ ] Pagination performs well with large datasets
- [ ] Query invalidation verified (related data updates)
- [ ] Optimistic updates provide smooth UX
