/**
 * Login page route.
 * Uses react-hook-form for form state management.
 * Respects redirect query parameter for post-login navigation.
 */
import { useEffect } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useAuth } from "../lib/auth-context";
import { getSafeRedirect } from "../lib/auth-utils";

interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

export function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const redirectTo = getSafeRedirect(search.redirect);
      navigate({ to: redirectTo });
    }
  }, [isLoading, isAuthenticated, navigate, search.redirect]);

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await login(data.email, data.password, data.rememberMe);
      // Navigate to redirect target or fallback to /onboarding
      const redirectTo = getSafeRedirect(search.redirect);
      navigate({ to: redirectTo });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Login failed. Please try again.";
      setError("root", { type: "server", message });
    }
  };

  // Don't render if already authenticated (redirect will happen)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="login-page">
      <header>
        <h1>Login to LedgerMx</h1>
      </header>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="login-form"
        aria-label="Login Form"
      >
        {errors.root && (
          <div className="error-message" role="alert">
            {errors.root.message}
          </div>
        )}

        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            autoComplete="email"
            disabled={isSubmitting}
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Please enter a valid email address",
              },
            })}
          />
          {errors.email && (
            <span className="error">{errors.email.message}</span>
          )}
        </div>

        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            autoComplete="current-password"
            disabled={isSubmitting}
            {...register("password", {
              required: "Password is required",
            })}
          />
          {errors.password && (
            <span className="error">{errors.password.message}</span>
          )}
        </div>

        <div>
          <label htmlFor="rememberMe">
            <input
              type="checkbox"
              id="rememberMe"
              disabled={isSubmitting}
              {...register("rememberMe")}
            />
            Remember me (extends session to 30 days)
          </label>
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
      </form>

      <p>
        Don't have an account? <a href="/register">Register here</a>
      </p>
    </div>
  );
}

export default LoginPage;
