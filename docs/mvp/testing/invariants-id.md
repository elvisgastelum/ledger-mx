# ID Invariant

## Rule

All IDs must be UUID v4 format.

## Test

```typescript
test('ID must be UUID v4', () => {
  expect(() => new UserId('invalid')).toThrow();
  expect(() => new UserId(crypto.randomUUID())).not.toThrow();
});
```

## Related

- [Invariants Overview](./invariants.md) - all invariants index
