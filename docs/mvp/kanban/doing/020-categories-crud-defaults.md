# Story: Categories CRUD & Default Categories

**Status**: Doing
**Priority**: P0
**Estimated**: 2 days

## Goal

Implement full categories CRUD (not just category groups), default/system categories, and category selection in transaction flows.

## Context

- Current implementation has category groups (015-category-groups.md) but individual categories CRUD is incomplete
- Users need default/system categories pre-populated for common expenses
- Category selection is required when creating/editing transactions
- Category archiving needed to hide old categories without losing data
- All categories must be user-scoped (or system-wide for defaults)

## Acceptance Criteria

- [x] Categories CRUD API endpoints (create, read, update, archive)
- [x] Default/system categories seeded on user onboarding
- [x] Category selection dropdown/modal in transaction forms
- [x] Category archiving (soft delete) preserves historical data
- [x] Categories listed by group with hierarchy
- [x] User can create custom categories within groups
- [x] System categories marked as non-deletable
- [x] Category usage counts displayed (how many transactions use it)

## Technical Notes

API endpoints:

- `POST /api/v1/categories` - Create category
- `GET /api/v1/categories` - List categories (filter by group, active only)
- `GET /api/v1/categories/:id` - Get single category
- `PUT /api/v1/categories/:id` - Update category
- `POST /api/v1/categories/:id/archive` - Archive category (soft delete)

Default categories to seed:

- Housing: Rent/Mortgage, Property Tax, Home Insurance, Maintenance
- Transportation: Fuel, Public Transit, Car Payment, Insurance, Maintenance
- Food: Groceries, Dining Out, Coffee/Snacks
- Utilities: Electricity, Water, Gas, Internet, Phone
- Healthcare: Insurance, Prescriptions, Doctor Visits
- Personal: Clothing, Grooming, Entertainment
- Debt: Credit Card Payments, Loan Payments
- Savings: Emergency Fund, Goals

Files/modules to touch:

- `packages/domain/src/category/category.entity.ts`
- `packages/application/src/category/category.service.ts`
- `packages/infra/src/database/repositories/category.repository.ts`
- `apps/api/src/category/category.controller.ts` (ts-rest contract)
- `apps/web/src/category/` (components, hooks)
- `apps/web/src/transaction/` (add category selection)

## Tests Required

- [ ] Unit tests: category creation with group validation
- [ ] Unit tests: prevent deletion of system categories
- [ ] Integration tests: category CRUD API
- [ ] Integration tests: category archiving preserves transactions
- [ ] E2E tests: category selection in transaction form
- [ ] E2E tests: default categories seeded on onboarding
- [ ] Cross-user isolation: categories not shared between users

## Dependencies

- 015-category-groups.md
- 016-category-layout-onboarding.md
- 017-accounts-transactions-foundation.md

## Done Checklist

- [ ] All acceptance criteria met
- [ ] Default categories visible after onboarding
- [ ] Transaction form includes category selector
- [ ] Archived categories hidden from active lists
- [ ] Tests pass for all CRUD operations
- [ ] User scoping verified (no cross-user category leakage)
