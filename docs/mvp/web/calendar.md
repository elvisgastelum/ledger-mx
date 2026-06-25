# Financial Calendar

Show upcoming financial obligations on a calendar with due/overdue/upcoming statuses.

## Purpose

- Visualize upcoming bills, payments, and income
- Convert obligations to transactions (quick entry)
- Plan envelope funding before payday
- Avoid missed payments with overdue alerts

## Calendar Views

### Month View (Default)

```
┌─────────────────────────────────────────────────┐
│  January 2024  ◀   ▶                           │
├─────────────────────────────────────────────────┤
│  Su  Mo  Tu  We  Th  Fr  Sa                    │
│                  1●  2●  3   4   5   6          │
│   7   8   9  10● 11  12  13●                   │
│  14  15● 16  17  18  19  20                    │
│  21  22  23  24  25● 26  27                    │
│  28  29  30  31                                 │
├─────────────────────────────────────────────────┤
│  ● = Has obligation                             │
│  🔴 Overdue  🟡 Due soon  🟢 Upcoming           │
└─────────────────────────────────────────────────┘
```

- Dots/bars indicate days with obligations
- Color coding:
  - 🔴 Red: Overdue (past due date, not paid)
  - 🟡 Yellow: Due soon (within 3 days)
  - 🟢 Green: Upcoming (future, > 3 days)
- Tap day to see obligations list

### Day Detail (Tap to Expand)

```
┌─────────────────────────────────────────────────┐
│  January 15, 2024                               │
├─────────────────────────────────────────────────┤
│  🔴 OVERDUE                                     │
│  • Rent ($1,200) - 3 days overdue               │
│                                                 │
│  🟡 DUE SOON                                    │
│  • Electric Bill ($85) - due in 2 days          │
│    [Pay Now]                                    │
│                                                 │
│  🟢 UPCOMING                                    │
│  • Paycheck #3 ($2,500) - in 5 days             │
│    [Plan Envelopes]                             │
│  • Credit Card Payment ($150) - in 7 days       │
│    [Prepare Payment]                            │
└─────────────────────────────────────────────────┘
```

---

## Obligation Types

### 1. Recurring Bills

**Sources:**

- Recurring charges table (user-defined)
- Imported from bank transactions (future)

**Examples:**

- Rent/Mortgage (monthly, 1st)
- Utilities (monthly, 15th)
- Subscriptions (monthly/annual)
- Insurance (monthly/quarterly)

**Data shape:**

```typescript
interface RecurringBill {
  id: string; // UUID v4
  userId: string;
  name: string;
  amountCents: number; // integer cents
  frequency: "monthly" | "annual" | "weekly";
  dueDay: number; // day of month (1-31) or day of week (0-6)
  categoryId: string;
  accountId: string; // default payment account
  status: "active" | "archived";
  nextDueDate: string; // ISO8601 UTC
  createdAt: string; // UTC
  updatedAt: string; // UTC
}
```

**Status computation:**

```typescript
function getBillStatus(
  nextDueDate: string,
): "overdue" | "due_soon" | "upcoming" {
  const due = new Date(nextDueDate);
  const now = new Date();
  const daysUntilDue = Math.ceil(
    (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysUntilDue < 0) return "overdue";
  if (daysUntilDue <= 3) return "due_soon";
  return "upcoming";
}
```

---

### 2. Debt Payments

**Sources:**

- Debt accounts with payment schedules
- Minimum payment requirements

**Examples:**

- Credit card minimum payment (monthly)
- Loan payment (monthly)
- Mortgage principal+interest (monthly)

**Data shape:**

```typescript
interface DebtPayment {
  debtId: string;
  debtName: string;
  minimumPaymentCents: number;
  dueDate: string; // ISO8601 UTC
  isPaid: boolean;
  status: "overdue" | "due_soon" | "upcoming";
}
```

**Interaction:** Tap → "Prepare Payment" → opens transaction form pre-filled:

- Type: `debt_payment`
- Payee: Debt name
- Amount: Minimum payment (editable)
- Account: Default payment account

---

### 3. Income / Paydays

**Sources:**

- Paycheck plans (biweekly schedule)
- Recurring income (freelance, etc.)

**Examples:**

- Biweekly paycheck (every 2nd Friday)
- Bonus (yearly)
- Tax refund (future)

**Data shape:**

```typescript
interface IncomeEvent {
  id: string;
  userId: string;
  name: string;
  amountCents: number; // estimated
  frequency: "biweekly" | "monthly" | "annual";
  nextDate: string; // ISO8601 UTC
  categoryId: string; // e.g., "Salary"
  accountId: string; // default deposit account
}
```

**Interaction:** Tap → "Plan Envelopes" → opens envelope funding workflow:

1. Show estimated paycheck amount
2. Suggest envelope allocations (based on previous patterns)
3. Create envelope allocation transactions

---

### 4. Envelope Funding Targets

**Sources:**

- Envelope monthly targets
- Days until payday

**Examples:**

- "Food envelope: $400 target, $250 funded, need $150 more"
- "Emergency Fund: $5,000 target, $3,200 funded, need $1,800"

**Display on calendar:**

- Show on payday (when funding happens)
- Show warning X days before payday if underfunded

**Interaction:** Tap → opens envelope detail with funding action

---

## Status Definitions

| Status       | Color     | Days           | Action              |
| ------------ | --------- | -------------- | ------------------- |
| **Overdue**  | 🔴 Red    | < 0 (past due) | "Pay Now" prominent |
| **Due Soon** | 🟡 Yellow | 0-3 days       | "Prepare Payment"   |
| **Upcoming** | 🟢 Green  | > 3 days       | "Plan Envelopes"    |

---

## Interactions

### Convert Obligation to Transaction

**Flow:**

1. Tap obligation in calendar
2. Review pre-filled transaction details
3. Modify if needed (account, amount, note)
4. Tap "Save" → creates transaction

**Pre-filled fields:**

- Recurring Bill → Expense transaction:
  - Type: `expense`
  - Amount: Bill amount (editable)
  - Category: Bill category
  - Account: Default payment account
  - Note: Bill name
  - Date: Due date

- Debt Payment → Debt Payment transaction:
  - Type: `debt_payment`
  - Amount: Minimum payment (editable)
  - Payee: Debt name
  - Account: Default payment account
  - Date: Due date

- Income → Income transaction:
  - Type: `income`
  - Amount: Estimated amount (editable)
  - Category: "Salary" or income category
  - Account: Deposit account
  - Date: Payday

### Prepare Payment (Future)

For upcoming debt payments:

1. Tap "Prepare Payment"
2. Review payment details
3. Ensure sufficient funds in payment account
4. Schedule payment (immediate or on due date)

### Plan Envelopes (Future)

For upcoming paydays:

1. Tap "Plan Envelopes"
2. See suggested allocations based on:
   - Envelope targets
   - Upcoming bills
   - Previous funding patterns
3. Adjust allocations
4. Create envelope allocation transactions

---

## Data Source (Planned/Future API)

Generate calendar events from:

1. **Recurring charges table** (primary source for bills) _(Future)_
   - `GET /api/v1/recurring-charges?userId=xxx` (user-scoped, planned)

2. **Debt accounts** (for payment schedules) _(Implemented)_
   - `GET /api/v1/debts?userId=xxx` (user-scoped)

3. **Paycheck plans** (for income events) _(Future)_
   - `GET /api/v1/paycheck-plans?userId=xxx` (user-scoped, planned)

4. **Envelope targets** (for funding status) _(Implemented)_
   - `GET /api/v1/envelopes?userId=xxx` (user-scoped)

5. **Existing transactions** (to mark obligations as paid) _(Implemented)_
   - `GET /api/v1/transactions?userId=xxx&dateRange=...` (user-scoped)

**Note:** Calendar aggregation endpoint is planned for future implementation. MVP calendar will compose data from existing endpoints (transactions, debts, envelopes).

---

## API Endpoints (Planned/Future - User-Scoped)

_The following endpoints are planned for future implementation. See Data Source section for current MVP approach._

```
GET /api/v1/calendar-events?startDate=&endDate=
  → Returns all obligations in date range
  → Response: { overdue: [], dueSoon: [], upcoming: [] }
  → Status: Planned (Future)

GET /api/v1/recurring-charges
  → List recurring bills
  → Status: Planned (Future)

POST /api/v1/recurring-charges
  → Create recurring bill
  → Status: Planned (Future)

PUT /api/v1/recurring-charges/:id
  → Update recurring bill
  → Status: Planned (Future)

POST /api/v1/transactions
  → Create transaction from obligation (uses same endpoint)
  → Status: Implemented
```

All endpoints require authentication (`credentials: 'include'`) and are scoped by `user_id`.

---

## Implementation

### Calendar Component

Use React Big Calendar or custom calendar component:

```typescript
// apps/web/src/components/financial-calendar.tsx
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { useQuery } from '@tanstack/react-query';

export function FinancialCalendar() {
  const { userId } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: events, isLoading } = useQuery({
    queryKey: ['calendar-events', { userId, month: currentDate.getMonth() }],
    queryFn: () =>
      apiFetch(`/calendar-events?startDate=${monthStart}&endDate=${monthEnd}`),
    enabled: !!userId,
  });

  return (
    <Calendar
      localizer={dateFnsLocalizer}
      events={events}
      startAccessor="dueDate"
      titleAccessor="name"
      onSelectEvent={handleObligationClick}
      eventPropGetter={(event) => ({
        style: {
          backgroundColor: event.status === 'overdue' ? 'red' :
                           event.status === 'due_soon' ? 'yellow' : 'green',
        },
      })}
    />
  );
}
```

---

## Future Enhancements

- Drag-and-drop to reschedule obligations
- Conflict detection (overallocated paycheck)
- Integration with Google Calendar (future)
- Push notifications for due bills
- Auto-create transactions from recurring bills (with confirmation)
