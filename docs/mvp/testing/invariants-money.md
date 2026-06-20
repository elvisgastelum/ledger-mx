# Money Invariant

## Rule

All monetary values must be integer cents (no floats).

## Test

```typescript
test('money must be integer', () => {
  expect(() => assertValidMoney(123.45)).toThrow();
  expect(() => assertValidMoney(12345)).not.toThrow();
});
```

## Related

- [Invariants Overview](./invariants.md) - all invariants index
