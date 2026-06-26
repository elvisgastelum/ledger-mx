# Story: MVP Test Coverage

**Status**: Done
**Priority**: P0
**Estimated**: 3 days

## Goal

Achieve comprehensive test coverage for all MVP-critical paths including transactions, balances, auth, and cross-user isolation.

## Context

- Current test coverage gaps in transaction use cases, repositories, and API endpoints
- Balance repository and use cases need dedicated tests
- Cross-user isolation tests are critical for financial data security
- Auth refresh replay attacks need mitigation and testing
- Web route tests needed for critical user flows
- Manual validation checklist required for E2E scenarios

## Acceptance Criteria

- [ ] Transaction use cases tested (create, update, delete/reverse, list, filter)
- [ ] Transaction repositories tested (save, find, list with pagination)
- [ ] Transaction API E2E tests (all CRUD endpoints, error cases)
- [ ] Balance repository tests (calculate, update, snapshot)
- [ ] Balance use cases tests (recalculate, get balances)
- [ ] Balance controller/API tests
- [ ] Cross-user isolation tests for all financial endpoints
- [ ] Auth refresh token replay attack prevention tested
- [ ] Web route tests for critical paths (login, dashboard, transactions)
- [ ] Seed data validation tests
- [ ] Export functionality tests
- [ ] Manual validation checklist created and partially executed

## Technical Notes

Test categories:

1. **Unit Tests**: Use cases, repositories, domain logic
2. **Integration Tests**: API endpoints with test database (Testcontainers)
3. **E2E Tests**: Full stack with seeded data
4. **Manual Checklist**: Items requiring human verification

Files/modules to create/update:

- `packages/application/src/transaction/__tests__/`
- `packages/infra/src/database/repositories/__tests__/transaction.repository.test.ts`
- `apps/api/src/transaction/__tests__/transaction.e2e.test.ts`
- `apps/api/src/balance/__tests__/`
- `apps/web/src/tests/routes/`
- `docs/mvp/testing/manual-checklist.md`

Cross-user isolation pattern:

```typescript
test("user cannot access another user's transaction", async () => {
  const user1Transaction = await createTransactionAs(user1);
  const response = await requestAs(user2).get(
    `/transactions/${user1Transaction.id}`,
  );
  expect(response.status).toBe(403);
});
```

## Tests Required

- [ ] Transaction use case unit tests (5+ test cases)
- [ ] Transaction repository unit tests (8+ test cases)
- [ ] Transaction API E2E tests (10+ endpoints)
- [ ] Balance calculation tests (edge cases: negative, zero, multi-currency)
- [ ] Cross-user isolation tests (all financial entities)
- [ ] Auth refresh replay tests
- [ ] Web route protection tests
- [ ] Manual validation checklist document

## Dependencies

- 017-accounts-transactions-foundation.md
- 018-financial-safety-reversals.md (for reversal tests)

## Done Checklist

- [ ] All automated test suites pass
- [ ] Cross-user isolation verified for transactions, accounts, balances
- [ ] Manual checklist document created with 20+ items
- [ ] Test coverage report shows >80% for critical paths
- [ ] CI pipeline runs all test suites
