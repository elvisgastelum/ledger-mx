# Money Representation

## Rule: No Floating Point

All monetary values use integer minor units (cents). No floats.

## Representation

- Storage: `amount_cents` (integer)
- TypeScript: `amountCents: number`
- Example: $123.45 → `12345` cents

## Display

Format with `Intl.NumberFormat`. Parse input to cents immediately.

## Examples

```typescript
// Domain entity
interface Transaction {
  amountCents: number; // 12345 = $123.45
}

// Calculation
const balance = accountBalanceCents - envelopesCents;
```

## Input Parsing

```typescript
function parseMoneyInput(input: string): number {
  const amount = parseFloat(input.replace(/[^\d.-]/g, ""));
  return Math.round(amount * 100);
}
```

## Display Formatting

```typescript
function formatMoney(cents: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(cents / 100);
}
```

## Invariants

1. No floats in domain
2. Cents are integers
3. Precision: 2 decimal places max

## Common Mistakes

❌ `amount: 123.45` (float)
❌ Storing `decimal` in DB

✅ `amountCents: 12345` (integer)
✅ Store as integer in DB
