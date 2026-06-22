# Transaction Flow

UX flow for transaction creation and management. All financial data is user-scoped (`user_id`).

## Financial Invariants (Non-Negotiable)

These constraints apply to ALL transactions:

1. **Integer cents only**: No floats. `$12.34` → `1234` cents.
2. **UUID v4 client-generated IDs**: All records use `crypto.randomUUID()` before save.
3. **Double-entry**: Transaction lines must sum to zero.
4. **UTC timestamps internally**: Store `created_at`, `updated_at`, `transaction_date` in UTC.
5. **No hard deletes for synced/cleared records**: Use reversal or correction transactions.
6. **User-scoped**: Every query includes `WHERE user_id = $1`.

## Flow Overview

```
Dashboard → Tap (+) → Quick Entry Modal
                     ├─ Choose Template (one tap)
                     └─ Manual Entry → Full Form
```

## Entry Methods

### 1. Quick Entry (Primary)

Minimal fields for fast logging:

```
┌─────────────────────────────────────┐
│  Quick Entry                        │
├─────────────────────────────────────┤
│  Amount: $ ___________              │
│  Category: [Groceries ▼]            │
│  Account: [BBVA Debit ▼]            │
│                                     │
│  [Recent: Starbucks $5.67]          │
│  [Recent: Gas $45.00]               │
│                                     │
│  [Cancel]  [Save]                   │
└─────────────────────────────────────┘
```

- Amount parsed to cents immediately on blur
- Category select: typeahead with recent/frequent first
- Account select: dropdown (2-5 accounts typical)
- Save creates transaction with default type "expense"
- Validation: amount > 0, category required, account required

### 2. Manual Entry (Full Form)

All fields available; uses React Hook Form.

Required fields:

- **Amount** (parsed to cents immediately, stored as integer)
- **Type** (expense, income, transfer, debt_payment, envelope_allocation)
- **Account** (from Account select dropdown)

Optional fields:

- **Category** (from Category select with typeahead)
- **Note** (free text, max 500 chars)
- **Date** (default: now UTC, editable, stored as UTC)
- **Envelope** (optional allocation target)
- **Payee** (for expenses/income, typeahead from history)

## Category Select

- Typeahead input with filtered dropdown
- Recent categories for account type shown first
- Groups collapsed by default (expand to see all)
- "Add new category" option at bottom
- Categories scoped to user's category layout

```
Category: [Groceries...    ▼]
          ├─ Groceries (recent)
          ├─ Dining Out (recent)
          ├─ Gas (recent)
          ├─ ─── Food & Dining ───
          ├─   Groceries
          ├─   Dining Out
          ├─   Coffee Shops
          └─ + Add new category
```

## Account Select

- Dropdown (typically 2-5 accounts)
- Shows account name + last 4 digits (if card)
- Highlights default account for transaction type
- "Add new account" option at bottom

```
Account: [BBVA Debit (...1234) ▼]
         ├─ BBVA Debit (...1234) (default)
         ├─ Amex Credit (...5678)
         ├─ Cash
         └─ + Add new account
```

## Type-Specific Fields

### Expense

- Account (required)
- Category (required)
- Amount (required, > 0)
- Payee (optional, typeahead)
- Envelope (optional)

### Income

- Account (required)
- Category (optional)
- Amount (required, > 0)
- Payer (optional, typeahead)

### Transfer

- From Account (required)
- To Account (required, ≠ From Account)
- Amount (required, > 0)

### Debt Payment

- From Account (required)
- Debt (required, from user's debt accounts)
- Amount (required, > 0)
- Payee (auto-filled from debt config)

### Envelope Allocation

- From Account (required)
- To Envelope (required)
- Amount (required, > 0)
- Month (default: current)

## Validation & Error States

### Form-Level Validation (React Hook Form)

```typescript
const form = useForm<TransactionForm>({
  defaultValues: {
    amountCents: 0,
    type: "expense",
    accountId: "",
    categoryId: "",
    note: "",
    date: new Date().toISOString(), // UTC
  },
  mode: "onBlur", // validate on blur, not on change
});
```

### Validation Rules

| Field         | Rule                           | Error Message                                   |
| ------------- | ------------------------------ | ----------------------------------------------- |
| amountCents   | > 0                            | "Amount must be greater than zero"              |
| amountCents   | integer                        | "Amount cannot have more than 2 decimal places" |
| type          | required                       | "Transaction type is required"                  |
| accountId     | required                       | "Account is required"                           |
| categoryId    | required (expense/income)      | "Category is required"                          |
| fromAccountId | ≠ toAccountId (transfer)       | "From and To accounts must be different"        |
| envelopeId    | required (envelope_allocation) | "Envelope is required"                          |
| debtId        | required (debt_payment)        | "Debt account is required"                      |
| note          | max 500 chars                  | "Note must be 500 characters or less"           |

### Double-Entry Validation

Before save, verify transaction lines sum to zero:

```typescript
function validateDoubleEntry(lines: TransactionLine[]): boolean {
  const sum = lines.reduce((acc, line) => acc + line.amountCents, 0);
  return sum === 0;
}
```

If invalid, show error: "Transaction is unbalanced. Total: $X.XX"

### API Error Handling

- 400: Validation error → show field-specific errors
- 401: Unauthenticated → redirect to login
- 403: User scope violation → show "Access denied"
- 409: Conflict (e.g., duplicate ID) → show "Transaction already exists"
- 500: Server error → show "Something went wrong. Please try again."

## Save Action (with Financial Invariants)

**MVP Implementation:** Save persists via authenticated API; server cache updated via TanStack Query invalidation.

1. Generate UUID v4 (`crypto.randomUUID()`)
2. Parse amount to cents (integer, no floats)
3. Create transaction lines (double-entry):
   - Expense: `[{accountId, amountCents: -1234}, {categoryId, amountCents: 1234}]`
   - Income: `[{accountId, amountCents: 1234}, {categoryId, amountCents: -1234}]`
4. Validate lines sum to zero
5. Set `created_at`, `updated_at`, `transaction_date` to UTC
6. Set `user_id` from session
7. POST to authenticated API (`/api/v1/transactions`, `credentials: 'include'`)
8. Invalidate TanStack Query cache (`['transactions', { userId }]`)
9. Show success toast
10. Close modal/form

**Future (Local-First):** Local PGlite persistence with background sync queue (see Local-First Architecture section).

## Offline Behavior (Future)

_Local-first offline support is planned for post-MVP. MVP requires online connection for save operations._

Planned offline behavior:

- Save to local PGlite (optimistic)
- "Pending sync" indicator on transaction
- Auto-sync when online
- Conflict resolution: last-write-wins (with server timestamp)

## Edit/Delete Behavior

### Edit

- Allowed for unsynced/draft transactions (hard edit)
- For synced transactions: create correction transaction (no hard delete)
- Form pre-filled with existing values (React Hook Form `reset()`)

### Delete

- MVP: All deletes create reversal transactions (no hard deletes for financial records)
- Future (Local-First): Unsynced transactions hard delete from local PGlite; synced/cleared NOT ALLOWED
- Show warning: "This transaction is synced. To correct it, create a reversal transaction."

## Templates (Future)

- Save frequent transactions as templates for one-tap entry
- Template stores: type, category, account, note pattern, envelope
- Access from Quick Entry: "Recent & Templates" section
