import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  Outlet,
} from "@tanstack/react-router";
import { AuthProvider } from "./lib/auth-context";
import { AuthGuard } from "./components/auth-guard";
import { LogoutButton } from "./components/logout-button";
import LoginPage from "./routes/login";
import RegisterPage from "./routes/register";
import OnboardingWizard from "./routes/onboarding";
import { ExportForm } from "./components/export-form";
import AccountsPage from "./routes/accounts";
import TransactionsPage from "./routes/transactions";

// Home component for the '/' route
function Home() {
  return (
    <div>
      <header>
        <h1>Welcome to LedgerMx</h1>
        <LogoutButton />
      </header>
      <a href="/onboarding">Start Onboarding</a>
      
      <hr />
      
      <ExportForm />
    </div>
  );
}

// Create root route with Outlet for child routes
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Create the home route ('/')
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <AuthGuard>
      <Home />
    </AuthGuard>
  ),
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
const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboarding",
  component: () => (
    <AuthGuard>
      <OnboardingWizard />
    </AuthGuard>
  ),
});

// Create the accounts route ('/accounts')
const accountsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/accounts",
  component: () => (
    <AuthGuard>
      <AccountsPage />
    </AuthGuard>
  ),
});

// Create the transactions route ('/transactions')
const transactionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/transactions",
  component: () => (
    <AuthGuard>
      <TransactionsPage />
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
]);

// Create the router
const router = createRouter({
  routeTree,
});

// Render the app
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
);
