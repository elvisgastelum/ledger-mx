/**
 * Mobile navigation component.
 * Shows a hamburger menu on mobile that toggles a slide-out nav panel.
 * Mobile-first: 44px touch targets, full-width on small screens.
 */
import { Link } from "@tanstack/react-router";
import { cn } from "../lib/utils";
import { X } from "lucide-react";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const navigation = [
    { name: "Dashboard", to: "/" },
    { name: "Accounts", to: "/accounts" },
    { name: "Transactions", to: "/transactions" },
    { name: "Onboarding", to: "/onboarding" },
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Navigation panel */}
      <nav
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 transform bg-background shadow-lg transition-transform duration-200 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Mobile navigation"
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <h2 className="text-lg font-semibold">LedgerMx</h2>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px]"
            aria-label="Close navigation menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <ul className="space-y-1 p-4">
          {navigation.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="block min-h-[44px] w-full rounded-md px-4 py-2 hover:bg-accent"
                onClick={onClose}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
