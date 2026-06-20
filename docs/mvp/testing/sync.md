# Sync Testing

## Sync Scenarios to Test

### Online Sync

1. Create transaction → syncs to server
2. Update transaction → syncs to server
3. Delete transaction → syncs to server

### Offline Sync

1. Go offline → create transaction → stays in queue
2. Go online → queue flushes → transaction synced

### Conflict Resolution

1. Edit same transaction offline and online → conflict
2. User chooses resolution: Keep A, Keep B, Keep Both

## Test Setup

### Mock Electric Server

```typescript
// libs/testing/mocks/electric.ts
export const mockElectric = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  sync: vi.fn(),
};
```

### Test Offline Queue

```typescript
test('offline write queues', async () => {
  const db = createTestDb({ offline: true });
  
  await db.transactions.create({
    id: 'tx-1',
    amountCents: 10000,
  });
  
  const queue = await db.getSyncQueue();
  expect(queue).toHaveLength(1);
});
```

## E2E Sync Test

Use Playwright to test offline→online transition:

```typescript
test('offline to online sync', async ({ page }) => {
  await page.context().setOffline(true);
  await page.goto('/transactions/new');
  await page.fill('[name="amount"]', '100');
  await page.click('button[type="submit"]');
  
  await page.context().setOffline(false);
  // Wait for sync
  await page.waitForSelector('text=Synced');
});
```
