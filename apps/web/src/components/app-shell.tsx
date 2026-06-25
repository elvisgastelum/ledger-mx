/**
 * App shell component - provides the main layout structure for authenticated pages.
 * Includes header with navigation, mobile menu, and main content area.
 * Mobile-first: responsive design with hamburger menu on mobile.
 */
import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "../lib/utils";
import { MobileNav } from "./mobile-nav";
import { LogoutButton } from "./logout-button";
import { ThemeToggle } from "./theme-toggle";
import { Menu } from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: "Dashboard", to: "/" },
    { name: "Accounts", to: "/accounts" },
    { name: "Transactions", to: "/transactions" },
    { name: "Onboarding", to: "/onboarding" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="min-h-[44px] min-w-[44px] lg:hidden"
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Logo - centered on mobile, left on desktop */}
          <Link
            to="/"
            className="text-lg font-semibold lg:absolute lg:left-1/2 lg:-translate-x-1/2"
          >
            LedgerMx
          </Link>

          {/* Desktop navigation */}
          <nav
            className="hidden lg:flex lg:space-x-4"
            aria-label="Main navigation"
          >
            {navigation.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  location.pathname === item.to
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Logout button and theme toggle */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Mobile navigation */}
      <MobileNav
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
