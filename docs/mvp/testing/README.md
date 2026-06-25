# Testing Strategy

Testing approach for LedgerMx MVP.

## Testing Pyramid

1. **Unit Tests** (70%): Domain, Application layers
2. **Integration Tests** (20%): Infrastructure, API
3. **E2E Tests** (10%): Playwright user flows

## TDD Workflow

1. Write failing test
2. Write minimal code to pass
3. Refactor
4. Repeat

## Test Coverage

- Domain: 100% (invariants critical)
- Application: 90%+
- Infrastructure: 80%+
- UI: 70%+

## Tools

- **Vitest**: Unit/integration tests
- **Testing Library**: React component tests
- **Playwright**: E2E tests
- **Testcontainers**: PostgreSQL for integration tests
- **MSW**: Mock Service Worker for API (future)

## Test Types

See:

- [TDD Workflow](./tdd.md)
- [Backend Testing](./backend.md)
- [Frontend Testing](./frontend.md)
- [Invariants](./invariants.md)
- [Sync Testing](./sync.md)
