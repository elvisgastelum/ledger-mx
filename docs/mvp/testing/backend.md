# Backend Testing

## Tools

- **Vitest**: Test runner
- **Testcontainers**: PostgreSQL container
- **Supertest**: HTTP assertions

## Test Setup

### Testcontainers PostgreSQL

```typescript
// libs/testing/setup/postgres.ts
import { PostgreSqlContainer } from "testcontainers";

let container: PostgreSqlContainer;

beforeAll(async () => {
  container = await new PostgreSqlContainer().start();
  process.env.DATABASE_URL = container.getConnectionUri();
});

afterAll(async () => {
  await container.stop();
});
```

## Test Types

### Unit Tests

Test domain entities and use cases:

```typescript
test('create transaction', async () => {
  const useCase = new CreateTransactionUseCase(repo);
  const result = await useCase.execute({ ... });
  expect(result.id).toBeDefined();
});
```

### Integration Tests

Test API endpoints:

```typescript
test('POST /transactions', async () => {
  const res = await request(app.getHttpServer())
    .post('/transactions')
    .send({ amountCents: 10000, ... });

  expect(res.status).toBe(201);
});
```

## Mocking

Mock repository interfaces in unit tests:

```typescript
const mockRepo = { save: vi.fn() };
```
