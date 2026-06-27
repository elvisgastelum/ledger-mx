import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  Outlet,
} from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./lib/auth-context";
import { AuthGuard } from "./components/auth-guard";
import { AppShell } from "./components/app-shell";
import { createQueryClient } from "./lib/query-client";
import { Toaster } from "./lib/toast";
import { ThemeProvider } from "./components/theme-provider";
import LoginPage from "./routes/login";
import RegisterPage from "./routes/register";
import OnboardingWizard from "./routes/onboarding";
import { ExportForm } from "./components/export-form";
import AccountsPage from "./routes/accounts";
import TransactionsPage from "./routes/transactions";
import EnvelopesPage from "./routes/envelopes";

// Home component for the '/' route
function Home() {
  return (
    <AppShell>
      <div>
        <h1>Welcome to LedgerMx</h1>
        <a href="/onboarding">Start Onboarding</a>

        <hr />

        <ExportForm />
      </div>
    </AppShell>
  );
}

// Create root route with Outlet for child routes
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Create the home route ('/')
// Public route - no AuthGuard so smoke tests can see "Welcome to LedgerMx"
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => <Home />,
});

// Create the login route ('/login')
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  validateSearch: (search: Record<string, unknown>) => {
    return {
      redirect: (search.redirect as string) || undefined,
    };
  },
  component: LoginPage,
});

// Create the register route ('/register')
const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  validateSearch: (search: Record<string, unknown>) => {
    return {
      redirect: (search.redirect as string) || undefined,
    };
  },
  component: RegisterPage,
});

// Create the onboarding route ('/onboarding')
// Public route - accessible without authentication for first-time setup
const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboarding",
  component: () => (
    <AppShell>
      <OnboardingWizard />
    </AppShell>
  ),
});

// Create the accounts route ('/accounts')
const accountsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/accounts",
  component: () => (
    <AuthGuard>
      <AppShell>
        <AccountsPage />
      </AppShell>
    </AuthGuard>
  ),
});

// Create the transactions route ('/transactions')
const transactionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/transactions",
  component: () => (
    <AuthGuard>
      <AppShell>
        <TransactionsPage />
      </AppShell>
    </AuthGuard>
  ),
});

// Create the envelopes route ('/envelopes')
const envelopesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/envelopes",
  component: () => (
    <AuthGuard>
      <AppShell>
        <EnvelopesPage />
      </AppShell>
    </AuthGuard>
  ),
});

// Build the route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  onboardingRoute,
  accountsRoute,
  transactionsRoute,
  envelopesRoute,
]);

// Create the router
const router = createRouter({
  routeTree,
});

// Create QueryClient instance
const queryClient = createQueryClient();

// Render the app
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="ledger-mx-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
          <Toaster position="top-center" />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
