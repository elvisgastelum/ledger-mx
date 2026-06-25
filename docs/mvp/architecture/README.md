# Architecture Documentation

Clean Architecture / Onion Architecture implementation for LedgerMx.

## Files

- [Clean Architecture](./clean-architecture.md) - Layer structure and dependencies
- [Workspaces](./workspaces.md) - Monorepo package organization
- [ID Strategy](./id-strategy.md) - UUID v4 client-generated approach
- [Money](./money.md) - Integer minor units, no floats
- [Delete/Correction Rules](./delete-correction-rules.md) - Soft delete and reversals

## Architecture Overview

```
┌─────────────────────────────────────────┐
│  Web (React PWA) / API (NestJS)        │  Frameworks
├─────────────────────────────────────────┤
│  Application Layer (Use Cases)          │  libs/application
├─────────────────────────────────────────┤
│  Domain Layer (Entities, Rules)         │  libs/domain
├─────────────────────────────────────────┤
│  Database / Sync / Contracts            │  libs/database, libs/sync
└─────────────────────────────────────────┘
```

## Core Principles

1. **Dependency Rule**: Dependencies point inward only
2. **Framework Independent**: Domain doesn't depend on React, NestJS, etc.
3. **Testable**: Business rules testable without UI, DB, or frameworks
4. **UI Independent**: UI can change without changing business rules
5. **Database Independent**: Can swap PGlite, PostgreSQL, etc.

## Layer Responsibilities

### Domain Layer (libs/domain)

- Entities: Account, Transaction, Envelope, Debt, etc.
- Value Objects: Money, DateRange, etc.
- Domain Events: TransactionCreated, etc.
- Repository Interfaces: Define data access contracts

### Application Layer (libs/application)

- Use Cases: CreateTransaction, CalculateSpendableBalance, etc.
- Application Services: Orchestrate domain objects
- DTOs: Data transfer between layers

### Infrastructure Layer (Frameworks)

- Repositories: Drizzle ORM, PGlite implementations
- Controllers: NestJS REST endpoints
- UI Components: React + TanStack
- Sync: Electric client + TanStack DB shapes

## Key Decisions

- Client-generated UUID v4 for all entities
- Integer minor units for money (no floats)
- Offline-first: local SQL (PGlite) then sync (Electric)
- Soft delete with reversal for corrections
- UTC for all dates/times: database, API, and internal logic; local timezone conversion only for display
