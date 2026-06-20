# Transaction Flow

UX flow for transaction creation.

## Flow

```
Open App → Tap (+) → Choose template or manual → Save
```

## Transaction Types

- Expense
- Income
- Transfer
- Debt Payment
- Envelope Allocation

## Manual Entry Form

Required fields:
- Amount (parsed to cents immediately)
- Type
- Account

Optional fields:
- Category
- Note
- Date (default: now)
- Envelope

## Type-Specific Fields

### Expense

Account, Category, Amount

### Income

Account, Category (optional), Amount

### Transfer

From Account, To Account, Amount

### Debt Payment

From Account, Debt, Amount

### Envelope Allocation

From Account, To Envelope, Amount

## Save Action

1. Generate UUID v4
2. Create transaction lines (double-entry)
3. Save to PGlite
4. Add to sync queue
5. Show success toast

## Offline Behavior

Same flow. "Pending sync" indicator. Auto-sync when online.

## Templates (Future)

Save frequent transactions as templates for quick entry.
