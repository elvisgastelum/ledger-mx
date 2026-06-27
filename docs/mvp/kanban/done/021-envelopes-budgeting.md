# Story: Envelopes Budgeting System

**Status**: Todo
**Priority**: P0
**Estimated**: 3 days

## Goal

Implement envelope budgeting system with protected allocations, funding transactions, envelope balances, and idempotent onboarding with default envelopes.

## Context

- Envelope budgeting is core MVP feature: users allocate money to spending categories
- Envelopes must have protected allocations (cannot overspend)
- Funding transactions move money from accounts to envelopes
- Envelope balances must be tracked and validated
- New users need default envelopes created during onboarding
- All envelopes must be user-scoped with cross-user isolation

## Acceptance Criteria

- [ ] Envelope contracts defined in ts-rest
- [ ] Envelope API endpoints (CRUD + allocate/fund)
- [ ] Envelope use cases (create, update, allocate, fund, get balance)
- [ ] Envelope repository (save, find, get balances)
- [ ] Protected allocations: prevent overspending envelope balance
- [ ] Funding transactions: move money from account to envelope
- [ ] Envelope balance calculation (runtime-derived from transactions)
- [ ] Default envelopes created on onboarding (idempotent)
- [ ] Envelope UI: list, create, fund, view balance
- [ ] Cross-user isolation verified

## Technical Notes

Envelope model:
```typescript
interface Envelope {
  id: string;
  userId: string;
  name: string;
  categoryGroupId?: string;
  balance: number; // runtime-derived
  allocated: number; // runtime-derived
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

API endpoints:
- `POST /api/v1/envelopes` - Create envelope
- `GET /api/v1/envelopes` - List envelopes
- `GET /api/v1/envelopes/:id` - Get envelope
- `PUT /api/v1/envelopes/:id` - Update envelope
- `POST /api/v1/envelopes/:id/fund` - Fund envelope (from account)
- `POST /api/v1/envelopes/:id/allocate` - Allocate budget amount
- `GET /api/v1/envelopes/:id/transactions` - Get envelope transactions

Default envelopes:
- Groceries, Dining Out, Transportation, Utilities, Emergency Fund, Goals

Funding transaction flow:
1. User selects account + amount
2. System creates transaction: Account (expense) → Envelope (income)
3. Validate sufficient account balance
4. Update envelope balance

Files/modules to touch:
- `packages/domain/src/envelope/envelope.entity.ts`
- `packages/application/src/envelope/envelope.service.ts`
- `packages/infra/src/database/repositories/envelope.repository.ts`
- `apps/api/src/envelope/envelope.controller.ts` (ts-rest contract)
- `apps/web/src/envelope/` (components, hooks, pages)

## Tests Required

- [ ] Unit tests: envelope creation and validation
- [ ] Unit tests: protected allocation logic (overspend prevention)
- [ ] Unit tests: funding transaction creation
- [ ] Integration tests: envelope CRUD API
- [ ] Integration tests: envelope funding flow
- [ ] Integration tests: envelope balance calculation
- [ ] E2E tests: envelope UI flows
- [ ] E2E tests: idempotent onboarding (run twice, no duplicates)
- [ ] Cross-user isolation: envelopes not visible across users

## Dependencies

- 017-accounts-transactions-foundation.md
- 020-categories-crud-defaults.md (categories for envelope grouping)

## Done Checklist

- [ ] All acceptance criteria met
- [ ] Default envelopes created during onboarding
- [ ] Envelope funding transaction works end-to-end
- [ ] Overspend protection validated
- [ ] Envelope balances accurate (verified with integration tests)
- [ ] Cross-user isolation tested
- [ ] UI functional for core envelope operations
