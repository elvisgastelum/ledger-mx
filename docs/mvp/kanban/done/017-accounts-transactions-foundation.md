# Story: Accounts and Transactions Foundation

**Status**: Done
**Priority**: P0
**Estimated**: 5 days

## Goal

Enable authenticated users to create/manage accounts and create/list basic double-entry transactions so MVP validation can test core financial flows.

## Context

Current implemented features are auth, category groups/onboarding, export, ts-rest routing; contracts define some planned reports/health but no implemented accounts/transactions controller/web UI; MVP success criteria for transaction entry, spendable balance, envelope planning, debt progress, ledger invariants, and offline/sync are blocked by missing core financial data entry.

## Acceptance Criteria

- [x] Account contract/schema/endpoints for list/create/update/archive or equivalent user-scoped lifecycle
- [x] Account API controller/use cases/repository methods with user_id scoping
- [x] Transaction contract/schema/endpoints for create/list basic transactions
- [x] Transaction API controller/use cases/repository methods enforcing integer cents, UUID v4 client-generated IDs, UTC timestamps, user scope, and double-entry lines summing to zero
- [x] Web account list/create/edit or archive UI using react-hook-form
- [x] Web transaction list and new transaction form using react-hook-form
- [x] Tests for cross-user isolation, money/integer cents, UUID and double-entry invariants

## Technical Notes

- Follow ts-rest + Zod route pattern as established in 014-ts-rest-contracts.md
- Respect project architecture boundaries: Web/API → application → domain; domain and application must NOT import contracts or ts-rest
- Use integer cents only, NO floats for financial amounts
- Use UUID v4 client-generated IDs for financial records
- No hard deletes for financial records after sync/cleared; use reversal/correction
- Use UTC timestamps internally
- Use `credentials: 'include'` for authenticated fetches on web (match existing pattern)
- Offline/PGlite sync and reports may be separate follow-up stories unless minimal balance display is needed for this slice

## Tests Required

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm test:web`
- `pnpm test:e2e` (if environment permits)

## Dependencies

- 001-database-model.md
- 002-ledger-model.md
- 003-api-model.md
- 014-ts-rest-contracts.md
- 015-category-groups.md
- 016-category-layout-onboarding.md

## Done Checklist

- [x] All acceptance criteria met
- [x] Story reviewed and approved
