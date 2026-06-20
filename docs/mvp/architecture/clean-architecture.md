# Clean Architecture

## Layer Structure

```
libs/domain              # Innermost: Entities, Value Objects, Rules
libs/application         # Use Cases, Application Services, DTOs
libs/database           # Repository Implementations (Drizzle)
libs/contracts          # ts-rest API Contracts (outer boundary)
libs/sync              # Electric Client, Shape Definitions
apps/api               # NestJS Controllers, Modules (Frameworks)
apps/web               # React Components, Routes (Frameworks)
```

## Dependency Rule

Dependencies point **inward only**:

```
Web/API → Application → Domain
         ↑            ↑
         └────────────┘
      (implements interfaces)
```

- **Domain** has NO dependencies on outer layers
- **Application** depends only on Domain
- **Infrastructure** (database, sync) depends on Domain interfaces
- **Web/API** depends on Application and Infrastructure

## Domain Layer (libs/domain)

### Entities

- Transaction: id, amountCents, type, accountId, categoryId, date, lines (double-entry)
- Account: id, name, type, balanceCents, userId
- Envelope: id, name, allocatedCents, spentCents, userId

### Value Objects

- `Money`: amountCents, currency (no floats)
- `UserId`: UUID v4 wrapper
- `DateRange`: start, end

### Repository Interfaces

- TransactionRepository: save, findById, findByUserId
- AccountRepository: save, findById, findByUserId
- EnvelopeRepository: save, findById, findByUserId

## Application Layer (libs/application)

### Use Cases

- `CreateTransactionUseCase`
- `CalculateSpendableBalanceUseCase`
- `SyncPendingTransactionsUseCase`

### Application Services

- Orchestrate domain objects
- Handle cross-entity operations
- No framework dependencies

## Infrastructure Layer

### Repository Implementations

- `DrizzleTransactionRepository` implements `TransactionRepository`
- `PGliteTransactionRepository` implements `TransactionRepository`

### Framework Adapters

- NestJS controllers call use cases
- React components call hooks → use cases

## API Contract Boundary Rule

`libs/contracts` is a transport-layer API boundary package, not part of core business logic:

### Allowed Dependencies

- `apps/api` may import and implement `libs/contracts` using `@ts-rest/nest`
- `apps/web` may import and consume `libs/contracts` using `@ts-rest/react-query/v5`
- OpenAPI generation tools may import `libs/contracts` to generate specs

### Forbidden Dependencies

- `libs/domain` must never import `libs/contracts` or any `@ts-rest/*` packages
- `libs/application` must never import `libs/contracts` or any `@ts-rest/*` packages

## Testing Strategy

- Domain: Pure unit tests, no mocks needed
- Application: Unit tests with mocked repositories
- Infrastructure: Integration tests with Testcontainers
- E2E: Playwright with seed data
