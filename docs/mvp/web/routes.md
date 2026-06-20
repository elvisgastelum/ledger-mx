# Web Routes

## Route Definitions

### Public Routes

- `/login` - Login page
- `/register` - Registration page

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
- `/export` - Export CSV/ZIP
- `/settings` - User settings

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
