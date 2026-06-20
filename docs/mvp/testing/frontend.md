# Frontend Testing

## Tools

- **Vitest**: Test runner
- **Testing Library**: Component tests
- **MSW**: Mock API (future)

## Component Tests

### Render Component

```typescript
// apps/web/src/components/__tests__/TransactionForm.test.tsx
import { render, screen } from '@testing-library/react';
import { TransactionForm } from '../TransactionForm';

test('renders amount input', () => {
  render(<TransactionForm />);
  expect(screen.getByLabelText('Amount')).toBeInTheDocument();
});
```

### User Interactions

```typescript
import userEvent from '@testing-library/user-event';

test('submits form', async () => {
  const onSubmit = vi.fn();
  render(<TransactionForm onSubmit={onSubmit} />);
  
  await userEvent.type(screen.getByLabelText('Amount'), '100');
  await userEvent.click(screen.getByText('Save'));
  
  expect(onSubmit).toHaveBeenCalledWith({ amountCents: 10000 });
});
```

## Hook Tests

Test custom hooks with `@testing-library/react-hooks`:

```typescript
test('useTransactions hook', () => {
  const { result } = renderHook(() => useTransactions());
  expect(result.current.transactions).toEqual([]);
});
```

## Mocking

Mock TanStack Query:

```typescript
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: mockData, isLoading: false }),
}));
```
