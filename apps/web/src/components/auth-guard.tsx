/**
 * Auth guard component that protects routes requiring authentication.
 * Shows loading state while checking auth, redirects to /login if unauthenticated.
 * Preserves the intended destination as a redirect query parameter.
 */
import { useEffect } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "../lib/auth-context";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only redirect after loading is complete and user is not authenticated
    if (!isLoading && !isAuthenticated) {
      // Capture redirect path from window.location before any navigation
      // This avoids the issue where location.pathname may already be '/login'
      // when using TanStack Router's useLocation()
      const redirectPath = window.location.pathname;
      navigate({
        to: "/login",
        search: { redirect: redirectPath },
      });
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="auth-loading">
        <p>Loading...</p>
      </div>
    );
  }

  // If not authenticated, don't render children (redirect will happen via useEffect)
  if (!isAuthenticated) {
    return null;
  }

  // User is authenticated, render children
  return <>{children}</>;
}
