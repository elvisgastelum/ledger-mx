# Web Routes

Route definitions for the LedgerMx web app using TanStack Router.

## Current Implementation State

**Implemented routes:**

- `/` - Dashboard (stub)
- `/onboarding` - New user setup wizard

**Target MVP routes (this document):**

- `/` - Dashboard
- `/transactions` - Transaction list and management
- `/accounts` - Account management
- `/envelopes` - Envelope budgeting
- `/reports` - Financial reports

> **Note:** The five MVP routes above are the target UX model. Current implementation has only `/` and `/onboarding`. Additional routes listed under "Future Routes" are planned post-MVP.

## MVP Route Definitions

### 1. Dashboard (`/`)

**Responsibilities:**

- Show spendable balance (prominently)
- Recent transactions (last 10)
- Quick entry button (+)
- Upcoming obligations preview (next 7 days)
- Account balances summary
- Envelope funding status

**Data Dependencies:**

- `GET /api/v1/accounts` (user-scoped) → account balances
- `GET /api/v1/transactions?limit=10` (user-scoped) → recent transactions
- `GET /api/v1/envelopes` (user-scoped) → envelope balances
- `GET /api/v1/upcoming?days=7` (user-scoped) → upcoming obligations

**TanStack Query Keys:**

```typescript
["accounts", { userId }][("transactions", { userId, limit: 10 })][
  ("envelopes", { userId })
][("upcoming", { userId, days: 7 })];
```

**Components:**

- `<SpendableBalanceCard />`
- `<RecentTransactionsList />`
- `<QuickEntryButton />`
- `<UpcomingObligationsPreview />`

---

### 2. Transactions (`/transactions`)

**Responsibilities:**

- List all transactions (paginated, filterable)
- Filter by: date range, category, account, type
- Sort by: date (default), amount, category
- Tap to view/edit transaction
- Floating action button for new transaction

**Data Dependencies:**

- `GET /api/v1/transactions` (user-scoped) with query params:
  - `?startDate=ISO8601&endDate=ISO8601`
  - `?categoryId=uuid`
  - `?accountId=uuid`
  - `?type=expense|income|transfer`
  - `?page=1&limit=50`

**TanStack Query Keys:**

```typescript
["transactions", { userId, filters }];
```

**Route Patterns (TanStack Router):**

```typescript
// apps/web/src/routes/transactions.tsx
export const transactionsRoute = createRoute({
  path: "/transactions",
  component: TransactionsList,
  loader: ({ context }) => {
    // Prefetch transactions
    context.queryClient.ensureQueryData({
      queryKey: ["transactions", { userId: context.auth.userId }],
      queryFn: () => api.getTransactions(),
    });
  },
});

export const transactionNewRoute = createRoute({
  path: "/transactions/new",
  component: TransactionForm,
});

export const transactionEditRoute = createRoute({
  path: "/transactions/$transactionId",
  component: TransactionEditForm,
});
```

**Components:**

- `<TransactionsList />`
- `<TransactionFilters />`
- `<TransactionRow />`
- `<TransactionForm />` (React Hook Form)

---

### 3. Accounts (`/accounts`)

**Responsibilities:**

- List all accounts with balances
- Add new account
- Edit account (name, type, notes)
- View account transaction history (future)
- Archive/delete account (if no transactions)

**Data Dependencies:**

- `GET /api/v1/accounts` (user-scoped) → all accounts with balances
- `GET /api/v1/accounts/:id/transactions` (user-scoped) → account history (future)

**TanStack Query Keys:**

```typescript
["accounts", { userId }];
```

**Route Patterns:**

```typescript
export const accountsRoute = createRoute({
  path: "/accounts",
  component: AccountsList,
});

export const accountNewRoute = createRoute({
  path: "/accounts/new",
  component: AccountForm,
});

export const accountEditRoute = createRoute({
  path: "/accounts/$accountId",
  component: AccountEditForm,
});
```

**Components:**

- `<AccountsList />`
- `<AccountCard />`
- `<AccountForm />` (React Hook Form)

---

### 4. Envelopes (`/envelopes`)

**Responsibilities:**

- List all envelopes with funding status
- Show progress bars (funded vs target)
- Fund envelope (transfer from account)
- Create new envelope
- Edit envelope (name, target, color)
- View envelope transaction history (future)

**Data Dependencies:**

- `GET /api/v1/envelopes` (user-scoped) → all envelopes with balances
- `POST /api/v1/transactions` (user-scoped) → fund envelope (creates envelope_allocation transaction)
- `GET /api/v1/envelopes/:id/transactions` (user-scoped) → envelope history (future)

**TanStack Query Keys:**

```typescript
["envelopes", { userId }];
```

**Route Patterns:**

```typescript
export const envelopesRoute = createRoute({
  path: "/envelopes",
  component: EnvelopesList,
});

export const envelopeNewRoute = createRoute({
  path: "/envelopes/new",
  component: EnvelopeForm,
});

export const envelopeFundRoute = createRoute({
  path: "/envelopes/$envelopeId/fund",
  component: FundEnvelopeForm,
});
```

**Components:**

- `<EnvelopesList />`
- `<EnvelopeCard />`
- `<EnvelopeProgressBar />`
- `<FundEnvelopeForm />` (React Hook Form)

---

### 5. Reports (`/reports`)

**Responsibilities:**

- Spendable balance breakdown (Accounts - Envelopes - Upcoming)
- Expenses by category (pie/bar chart)
- Income vs expenses (time series)
- Debt progress (payoff timeline)
- Filter by date range

**Data Dependencies:**

- `GET /api/v1/reports/spendable-balance` (user-scoped)
- `GET /api/v1/reports/expenses-by-category?startDate=&endDate=` (user-scoped)
- `GET /api/v1/reports/income-vs-expenses?startDate=&endDate=` (user-scoped)
- `GET /api/v1/reports/debt-progress` (user-scoped) (future)

**TanStack Query Keys:**

```typescript
["reports", { userId, type: "spendable-balance" }][
  ("reports", { userId, type: "expenses-by-category", filters })
][("reports", { userId, type: "income-vs-expenses", filters })];
```

**Route Patterns:**

```typescript
export const reportsRoute = createRoute({
  path: "/reports",
  component: ReportsDashboard,
});
```

**Components:**

- `<SpendableBalanceChart />`
- `<ExpensesByCategoryChart />`
- `<IncomeVsExpensesChart />`
- `<DateRangeFilter />`

---

## Future Routes (Post-MVP)

### Calendar (`/calendar`)

- Financial calendar with obligations
- See [calendar.md](./calendar.md) for details

### Settings (`/settings`)

- User settings
- Category management
- Account management (also at `/accounts`)
- Export data

### Export (`/export`)

- Export CSV (ZIP post-MVP)

---

## Route Guards (TanStack Router)

All MVP routes require authentication:

```typescript
// apps/web/src/routes/_protected.tsx
export const ProtectedRoute = createRoute({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/login",
        search: { redirect: location.pathname },
      });
    }
  },
  loader: ({ context }) => {
    // Ensure user_id is available for all queries
    return { userId: context.auth.userId };
  },
});
```

Wrap MVP routes with `ProtectedRoute`:

```typescript
const mvpRoutes = createRoute({
  path: "/",
  component: ProtectedRoute,
  children: [
    dashboardRoute,
    transactionsRoute,
    accountsRoute,
    envelopesRoute,
    reportsRoute,
  ],
});
```

---

## API Call Pattern

All authenticated API calls use `credentials: 'include'`:

```typescript
// apps/web/src/lib/api-client.ts
export async function apiFetch(path: string, options: RequestInit = {}) {
  const url = `/api/v1${path}`;
  const response = await fetch(url, {
    ...options,
    credentials: "include", // Send HTTP-only cookies
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    // Handle 401, 403, 400, 500
    throw new ApiError(response.status, await response.json());
  }

  return response.json();
}
```

**User scoping:** All API routes are user-scoped via `user_id` from session (not from request params). Controllers extract `user_id` from session/token.

---

## Layout

```
<AppLayout>
  <Sidebar>
    <NavLink to="/">Dashboard</NavLink>
    <NavLink to="/transactions">Transactions</NavLink>
    <NavLink to="/accounts">Accounts</NavLink>
    <NavLink to="/envelopes">Envelopes</NavLink>
    <NavLink to="/reports">Reports</NavLink>
  </Sidebar>
  <MainContent>
    <Outlet /> <!-- Renders matched route -->
  </MainContent>
</AppLayout>
```

---

## Implementation (TanStack Router)

```typescript
// apps/web/src/routes.tsx
import { createRouter, createRoute, Outlet } from "@tanstack/react-router";

const rootRoute = createRoute({
  path: "/",
  component: AppLayout,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  transactionsRoute,
  accountsRoute,
  envelopesRoute,
  reportsRoute,
]);

const router = createRouter({
  routeTree,
  context: {
    auth: authContext, // { isAuthenticated, userId }
    queryClient,
  },
});
```
