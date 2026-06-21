# Web Routes

## Route Definitions

### Public Routes

- `/login` - Login page
- `/register` - Registration page
- `/onboarding` - New user setup wizard (category layout selection)

### Protected Routes (Require Auth)

- `/` - Dashboard (spendable balance, recent transactions)
- `/transactions` - Transaction list
- `/transactions/new` - Create transaction
- `/transactions/:id` - Edit transaction
- `/accounts` - Account list
- `/accounts/new` - Create account
- `/accounts/:id` - Edit account
- `/envelopes` - Envelope list
- `/envelopes/new` - Create envelope
- `/reports` - Reports (spendable balance, categories)
- `/calendar` - Financial calendar
- `/export` - Export CSV (ZIP future)
- `/settings` - User settings
  - `/settings/categories` - Manage categories and category groups
  - `/settings/categories/groups` - Category group management
  - `/settings/categories/list` - Category list and editing

## Route Guards

Use TanStack Router guards:

```typescript
// apps/web/src/routes/_protected.tsx
export const ProtectedRoute = createRoute({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
});
```

## Layout

```
<AppLayout>
  <Sidebar />
  <MainContent>
    <Outlet />
  </MainContent>
</AppLayout>
```

## Implementation

Use TanStack Router:

```typescript
const router = createRouter({
  routeTree,
  context: { auth: authContext },
});
```
