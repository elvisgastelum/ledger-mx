# Story: System Account & Balance Semantics

**Status**: Todo
**Priority**: P1
**Estimated**: 1 day

## Goal

Define system account type/visibility, exclude from user-visible lists where appropriate, document liability sign conventions for UI, and ensure balance calculations handle system accounts correctly.

## Context

- System accounts may exist for internal tracking (envelope funding, transfers)
- User-visible lists (accounts page, reports) should exclude system accounts
- Liability accounts (credit cards, loans) have negative balances - must be consistent
- Balance calculations must handle sign conventions correctly
- UI must clearly indicate liability vs asset accounts

## Acceptance Criteria

- [ ] System account type defined (isSystem boolean or account type enum)
- [ ] System accounts excluded from default account lists
- [ ] System accounts excluded from user-facing reports (unless explicitly included)
- [ ] Liability sign convention documented: negative balance = liability
- [ ] UI displays liability accounts with appropriate indicators (negative, red, "owed")
- [ ] Balance calculations correctly sum assets (+) and liabilities (-)
- [ ] Net worth calculation accurate with mixed account types
- [ ] System accounts visible in admin/debug views only

## Technical Notes

Account types:
```typescript
enum AccountType {
  CHECKING = 'checking',     // Asset: positive balance
  SAVINGS = 'savings',       // Asset: positive balance
  CREDIT_CARD = 'credit_card', // Liability: negative balance
  LOAN = 'loan',             // Liability: negative balance
  INVESTMENT = 'investment', // Asset: positive balance
  SYSTEM = 'system',         // Internal: hidden from user
}
```

System accounts:
- Used for envelope funding (envelope funding account)
- Used for internal transfers
- Not user-creatable or user-editable

Balance calculation:
```typescript
function calculateNetWorth(accounts: Account[]): number {
  return accounts
    .filter(a => !a.isSystem) // Exclude system accounts
    .reduce((sum, a) => sum + a.balance, 0);
}

function formatBalance(balance: number, type: AccountType): string {
  const sign = balance < 0 ? '-' : '';
  const prefix = type === AccountType.CREDIT_CARD || type === AccountType.LOAN 
    ? 'Owed: ' 
    : '';
  return `${prefix}${sign}$${Math.abs(balance)}`;
}
```

Files/modules to touch:
- `packages/domain/src/account/account.entity.ts`
- `packages/application/src/account/account.service.ts`
- `packages/infra/src/database/repositories/account.repository.ts`
- `apps/api/src/account/account.controller.ts`
- `apps/web/src/account/` (UI components)
- `apps/web/src/reports/` (balance calculations)

## Tests Required

- [ ] Unit tests: account type filtering (system excluded)
- [ ] Unit tests: balance calculation with mixed types
- [ ] Unit tests: liability sign convention enforcement
- [ ] Integration tests: account list API excludes system accounts
- [ ] Integration tests: balance reports correct with liabilities
- [ ] E2E tests: UI displays liability accounts correctly
- [ ] E2E tests: net worth calculation accurate

## Dependencies

- 017-accounts-transactions-foundation.md

## Done Checklist

- [ ] All acceptance criteria met
- [ ] System accounts hidden from user views
- [ ] Liability sign convention consistent across API and UI
- [ ] Balance calculations verified with integration tests
- [ ] Documentation updated: `docs/mvp/architecture/accounts.md`
- [ ] No system accounts visible in production UI
