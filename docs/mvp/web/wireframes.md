# Wireframes

## Status

Wireframes are **documentation-only** and may be planned in parallel.

## Design Principles

- **Mobile-first:** All wireframes show mobile (320px+) layout first
- **Responsive:** Tablet (768px+) and desktop (1024px+) layouts noted
- **Accessible:** Touch targets 44x44px minimum
- **Consistent:** Sidebar, header, and FAB placement consistent across routes

---

## MVP Route Wireframes

### 1. Dashboard (`/`)

#### Mobile (< 768px)

```
┌─────────────────────────────┐
│ ☰  LedgerMx       👤  ⚙️  │  ← Header (56px)
├─────────────────────────────┤
│                             │
│  Real Spendable Balance     │
│  $12,345.67                │  ← Large, prominent
│  ─────────────────────      │
│  Accounts  Envelopes  Upc.  │  ← Tap to filter
│  $15,000   $2,000     $654 │
│                             │
│  ─────────────────────      │
│  Recent Transactions        │
│  ┌───────────────────────┐  │
│  │ 🏪 Starbucks  -$5.67  │  │  ← Transaction row
│  │ 🍎 Groceries  -$45.00 │  │     (icon, name, amount)
│  │ ⛽ Gas       -$40.00  │  │
│  │ 💰 Paycheck  +$2,500  │  │
│  └───────────────────────┘  │
│                             │
│  [See All →]                │
│                             │
│  Upcoming (Next 7 Days)     │
│  • Rent ($1,200) - 3 days  │
│  • Paycheck - 5 days        │
│                             │
├─────────────────────────────┤
│          [+]                │  ← FAB (64px), fixed bottom-right
└─────────────────────────────┘
```

#### Desktop (≥ 1024px)

```
┌──────────────────────────────────────────────────────────┐
│ ☰  LedgerMx                          👤  ⚙️            │
├──────┬───────────────────────────────────────────────────┤
│      │                                                   │
│ Sid  │  Real Spendable Balance                           │
│ ebar │  $12,345.67                                      │
│ (240 │  ─────────────────────────────────────────────    │
│ px)  │  [Accounts] [Envelopes] [Upcoming]               │
│      │  $15,000    $2,000      $654                      │
│      │                                                   │
│      │  ┌─────────────────┬─────────────────┐            │
│      │  │ Recent Txns     │ Upcoming (7d)   │            │
│      │  │ • Starbucks     │ • Rent - 3d     │            │
│      │  │ • Groceries     │ • Paycheck - 5d │            │
│      │  │ • Gas           │                 │            │
│      │  │ [See All →]     │                 │            │
│      │  └─────────────────┴─────────────────┘            │
├──────┴───────────────────────────────────────────────────┤
│  [+] FAB fixed bottom-right                              │
└──────────────────────────────────────────────────────────┘
```

---

### 2. Transactions (`/transactions`)

#### Mobile (< 768px)

```
┌─────────────────────────────┐
│ ←  Transactions    [+]      │  ← Header with FAB
├─────────────────────────────┤
│ [Filters ▼]                │  ← Collapsible filters
│ Type: All  Cat: All  Date: │
│ ────────────────────────    │
│ ┌───────────────────────┐  │
│ │ 🏪 Starbucks          │  │
│ │ Dining Out  -$5.67    │  │  ← Category, amount
│ │ Jan 15                │  │  ← Date
│ └───────────────────────┘  │
│ ┌───────────────────────┐  │
│ │ 🍎 Groceries          │  │
│ │ Food  -$45.00         │  │
│ │ Jan 14                │  │
│ └───────────────────────┘  │
│                             │
│  [Load More...]            │  ← Pagination
│                             │
└─────────────────────────────┘
```

#### Filter Modal (Tap "Filters")

```
┌─────────────────────────────┐
│  Filters             [Done] │
├─────────────────────────────┤
│                             │
│  Type                       │
│  ○ All  ● Expense  ○ Income│
│  ○ Transfer  ○ Debt Pmt    │
│                             │
│  Category                   │
│  [All Categories ▼]        │
│                             │
│  Account                    │
│  [All Accounts ▼]          │
│                             │
│  Date Range                 │
│  [Jan 1] → [Jan 31] 📅     │
│                             │
│  [Clear Filters]            │
└─────────────────────────────┘
```

#### Desktop (≥ 1024px)

```
┌──────────────────────────────────────────────────────────┐
│ ←  Transactions                     [+]                  │
├──────┬───────────────────────────────────────────────────┤
│      │  Filters: [Type ▼] [Category ▼] [Date ▼] [X]    │
│ Sid  │  ─────────────────────────────────────────────    │
│ ebar │  ┌──────────────────────────────────────────┐     │
│      │  │ 🏪 Starbucks  Dining Out  Jan 15  -$5.67 │     │
│      │  │ 🍎 Groceries  Food       Jan 14  -$45.00│     │
│      │  │ ⛽ Gas       Transport   Jan 13  -$40.00│     │
│      │  └──────────────────────────────────────────┘     │
│      │  [Load More...]                                   │
└──────┴───────────────────────────────────────────────────┘
```

---

### 3. Transaction Quick Entry Flow

#### Quick Entry Modal (Default - Minimal Fields)

```
┌─────────────────────────────┐
│  Quick Entry       [X]      │  ← Modal header
├─────────────────────────────┤
│                             │
│  Amount*                    │
│  $ ___________              │  ← Auto-focus, parse to cents
│                             │
│  Category*                  │
│  [Groceries...    ▼]        │  ← Typeahead with recent first
│                             │
│  Account*                   │
│  [BBVA Debit...  ▼]        │  ← Dropdown
│                             │
│  ────────────────────────   │
│  [+ Add Note] (optional)    │  ← Expandable
│                             │
│  ────────────────────────   │
│  Recent:                    │
│  • Starbucks $5.67          │  ← Tap to autofill
│  • Gas $40.00               │
│                             │
│  [Cancel]  [Save]           │
└─────────────────────────────┘
```

#### Validation Error State

```
┌─────────────────────────────┐
│  Quick Entry       [X]      │
├─────────────────────────────┤
│                             │
│  Amount*                    │
│  $ 0.001                   │  ← Invalid input
│  ⚠ Amount cannot have more  │  ← Error message (red)
│    than 2 decimal places    │
│                             │
│  Category*                  │
│  [Select...       ▼]        │
│  ⚠ Category is required     │  ← Error message (red)
│                             │
│  [Cancel]  [Save]           │  ← Save disabled if errors
└─────────────────────────────┘
```

#### Full Form (Tap "More Fields" or "Manual Entry")

```
┌─────────────────────────────┐
│  New Transaction    [X]     │
├─────────────────────────────┤
│                             │
│  Type*                      │
│  [Expense ▼]                │  ← Expense/Income/Transfer/etc.
│                             │
│  Amount*                    │
│  $ ___________              │
│                             │
│  Account*                   │
│  [BBVA Debit...  ▼]        │
│                             │
│  Category                   │
│  [Groceries...    ▼]        │
│                             │
│  Date                       │
│  [2024-01-15] 📅            │  ← Date picker
│                             │
│  Note                       │
│  ___________                │
│                             │
│  Envelope (optional)        │
│  [Food...        ▼]         │
│                             │
│  ────────────────────────   │
│  [Cancel]  [Save]           │
└─────────────────────────────┘
```

**Form Implementation:** Uses React Hook Form with `useForm`, `register`, `handleSubmit`, `formState.errors`, `formState.isSubmitting`.

---

### 4. Accounts (`/accounts`)

#### Mobile (< 768px)

```
┌─────────────────────────────┐
│ ←  Accounts        [+]      │
├─────────────────────────────┤
│                             │
│  Total Balance              │
│  $15,000.00                │  ← Sum of all account balances
│                             │
│  ┌───────────────────────┐  │
│  │ 🏦 BBVA Debit          │  │
│  │ ...1234                │  │  ← Last 4 digits
│  │          $5,000.00    │  │  ← Balance (right-aligned)
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ 💳 Amex Credit         │  │
│  │ ...5678                │  │
│  │          -$2,000.00   │  │  ← Negative = red
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ 💵 Cash                │  │
│  │          $500.00       │  │
│  └───────────────────────┘  │
│                             │
└─────────────────────────────┘
```

#### Desktop (≥ 1024px)

```
┌──────────────────────────────────────────────────────────┐
│ ←  Accounts                              [+]              │
├──────┬───────────────────────────────────────────────────┤
│      │  Total Balance: $15,000.00                        │
│ Sid  │  ─────────────────────────────────────────────    │
│ ebar │  ┌──────────────────────────────────────────┐     │
│      │  │ 🏦 BBVA Debit (...1234)      $5,000.00  │     │
│      │  │ 💳 Amex Credit (...5678)    -$2,000.00  │     │
│      │  │ 💵 Cash                        $500.00   │     │
│      │  └──────────────────────────────────────────┘     │
└──────┴───────────────────────────────────────────────────┘
```

---

### 5. Envelopes (`/envelopes`)

#### Mobile (< 768px)

```
┌─────────────────────────────┐
│ ←  Envelopes       [+]      │
├─────────────────────────────┤
│                             │
│  Total Funded / Target      │
│  $2,000 / $3,000            │  ← Overall progress
│  [████████░░░░] 67%         │  ← Progress bar
│                             │
│  ┌───────────────────────┐  │
│  │ 🍎 Food        $250/400│  │  ← Name, funded/target
│  │ [████████░░] 63%       │  │  ← Progress bar
│  │ [Fund]                 │  │  ← Quick action
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ 🚗 Transport   $100/200│  │
│  │ [██████░░░░░] 50%      │  │
│  │ [Fund]                 │  │
│  └───────────────────────┘  │
│                             │
└─────────────────────────────┘
```

#### Fund Envelope Modal (Tap "Fund")

```
┌─────────────────────────────┐
│  Fund Envelope      [X]     │
├─────────────────────────────┤
│                             │
│  Envelope                   │
│  🍎 Food                    │
│  Current: $250 / $400       │
│                             │
│  From Account*               │
│  [BBVA Debit...  ▼]        │
│                             │
│  Amount*                    │
│  $ ___________              │  ← Suggest $150 (remaining)
│                             │
│  Note (optional)            │
│  ___________                │
│                             │
│  [Cancel]  [Fund Envelope]  │
└─────────────────────────────┘
```

#### Desktop (≥ 1024px)

```
┌──────────────────────────────────────────────────────────┐
│ ←  Envelopes                           [+]               │
├──────┬───────────────────────────────────────────────────┤
│      │  Total: $2,000 / $3,000 [████████░░░░] 67%      │
│ Sid  │  ─────────────────────────────────────────────    │
│ ebar │  ┌────────────────────────────────────────┐       │
│      │  │ 🍎 Food         $250/400  [Fund]      │       │
│      │  │ [████████░░] 63%                        │       │
│      │  │ 🚗 Transport    $100/200  [Fund]      │       │
│      │  │ [██████░░░░░] 50%                       │       │
│      │  └────────────────────────────────────────┘       │
└──────┴───────────────────────────────────────────────────┘
```

---

### 6. Reports (`/reports`)

#### Mobile (< 768px)

```
┌─────────────────────────────┐
│ ←  Reports                  │
├─────────────────────────────┤
│                             │
│  Date Range                 │
│  [Jan 1] → [Jan 31] 📅     │
│                             │
│  ────────────────────────   │
│  Spendable Balance           │
│  $12,345.67                │
│  Accounts - Envelopes -...  │
│                             │
│  ────────────────────────   │
│  Expenses by Category       │
│  ┌───────────────────────┐  │
│  │ 🍎 Food     $500  40%  │  │  ← Bar chart (ASCII)
│  │ ████████░░             │  │
│  │ 🚗 Transp  $300  25%   │  │
│  │ █████░░░░░             │  │
│  │ 📱 Phone   $200  17%   │  │
│  │ ███░░░░░░░             │  │
│  └───────────────────────┘  │
│                             │
│  [View Full Report →]       │
│                             │
└─────────────────────────────┘
```

#### Desktop (≥ 1024px)

```
┌──────────────────────────────────────────────────────────┐
│ ←  Reports                                               │
├──────┬───────────────────────────────────────────────────┤
│      │  Date Range: [Jan 1] → [Jan 31] 📅              │
│ Sid  │  ─────────────────────────────────────────────    │
│ ebar │  ┌─────────────────┬─────────────────┐            │
│      │  │ Spendable        │ Expenses by     │            │
│      │  │ Balance          │ Category        │            │
│      │  │ $12,345.67      │ 🍎 Food  $500   │            │
│      │  │                 │ 🚗 Trans $300   │            │
│      │  │ (breakdown)     │ 📱 Phone $200   │            │
│      │  └─────────────────┴─────────────────┘            │
│      │  ┌──────────────────────────────────────────┐      │
│      │  │ Income vs Expenses (chart)              │      │
│      │  │ (future)                                │      │
│      │  └──────────────────────────────────────────┘      │
└──────┴───────────────────────────────────────────────────┘
```

---

## Responsive Notes

### Mobile (< 768px)

- Single column layout
- Bottom tab bar (future) or header with nav
- FAB always visible (64x64px)
- Swipe gestures (future)
- Touch targets: 44x44px minimum

### Tablet (768px - 1023px)

- Two-column layout for dashboard/reports
- Sidebar collapses to icon-only (48px width)
- FAB visible

### Desktop (≥ 1024px)

- Full sidebar (240px width)
- Multi-column layouts
- Hover states on rows
- Keyboard shortcuts (future)

---

## Component Patterns

### Transaction Row

```
┌──────────────────────────────────────────┐
│ [Icon] Name           Category  Amount   │
│        Date                     (right)  │
└──────────────────────────────────────────┘
```

- Tap to edit
- Swipe left for delete (future)

### Card Component

```
┌──────────────────────────────────────────┐
│ Title                                    │
│ Value                                    │
│ [Optional action]                        │
└──────────────────────────────────────────┘
```

- 16px padding
- 8px border radius
- Shadow: `0 1px 3px rgba(0,0,0,0.1)`

### Modal/Dialog

- Centered on mobile
- Right-panel on tablet/desktop (future)
- Close on backdrop tap
- Escape key to close

---

## Color Coding

| Meaning  | Color  | Usage                        |
| -------- | ------ | ---------------------------- |
| Income   | Green  | `+` amounts, paycheck events |
| Expense  | Red    | `-` amounts, bill events     |
| Transfer | Blue   | Account transfers            |
| Envelope | Yellow | Envelope allocations         |
| Overdue  | Red    | Past due bills               |
| Due Soon | Yellow | Due within 3 days            |
| Upcoming | Green  | Due > 3 days                 |

---

## Future Wireframes

- Settings screens
- Onboarding flow (category layout selection)
- Calendar month view with obligations
- Debt payoff tracker
- Import workflow
