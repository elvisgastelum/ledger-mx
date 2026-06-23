/**
 * Logout button component for use in authenticated pages.
 */
import { useAuth } from "../lib/auth-context";
import { useNavigate } from "@tanstack/react-router";

interface LogoutButtonProps {
  className?: string;
}

export function LogoutButton({ className }: LogoutButtonProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login" });
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={className}
      aria-label="Logout"
    >
      Logout
    </button>
  );
}
