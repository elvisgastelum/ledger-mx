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
      // Preserve current pathname as redirect query parameter
      // Using pathname only (not search) to avoid issues with TanStack Router
      // parsed search object serialization
      const redirectPath = location.pathname;
      navigate({ 
        to: "/login", 
        search: { redirect: redirectPath },
      });
    }
  }, [isLoading, isAuthenticated, navigate, location]);

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
