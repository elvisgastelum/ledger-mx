import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  Outlet,
} from "@tanstack/react-router";
import OnboardingWizard from "./routes/onboarding";
import { ExportForm } from "./components/export-form";
import AccountsPage from "./routes/accounts";
import TransactionsPage from "./routes/transactions";

// Home component for the '/' route
function Home() {
  return (
    <div>
      <h1>Welcome to LedgerMx</h1>
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
  component: Home,
});

// Create the onboarding route ('/onboarding')
const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboarding",
  component: OnboardingWizard,
});

// Create the accounts route ('/accounts')
const accountsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/accounts",
  component: AccountsPage,
});

// Create the transactions route ('/transactions')
const transactionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/transactions",
  component: TransactionsPage,
});

// Build the route tree
const routeTree = rootRoute.addChildren([indexRoute, onboardingRoute, accountsRoute, transactionsRoute]);

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
    <RouterProvider router={router} />
  </StrictMode>
);
