/**
 * Register page route.
 * Uses react-hook-form for form state management.
 * Respects redirect query parameter for post-registration navigation.
 */
import { useEffect } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useAuth } from "../lib/auth-context";
import { getSafeRedirect } from "../lib/auth-utils";

interface RegisterFormValues {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  rememberMe: boolean;
}

export function RegisterPage() {
  const { register: registerUser, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: "/register" });

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      displayName: "",
      rememberMe: false,
    },
  });

  const password = watch("password");

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const redirectTo = getSafeRedirect(search.redirect);
      navigate({ to: redirectTo });
    }
  }, [isLoading, isAuthenticated, navigate, search.redirect]);

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      await registerUser(
        data.email,
        data.password,
        data.displayName || undefined,
        data.rememberMe
      );
      // Navigate to redirect target or fallback to /onboarding
      const redirectTo = getSafeRedirect(search.redirect);
      navigate({ to: redirectTo });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again.";
      setError("root", { type: "server", message });
    }
  };

  // Don't render if already authenticated (redirect will happen)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="register-page">
      <header>
        <h1>Create Your LedgerMx Account</h1>
      </header>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="register-form"
        aria-label="Registration Form"
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
            autoComplete="new-password"
            disabled={isSubmitting}
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters",
              },
              pattern: {
                value:
                  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                message:
                  "Password must contain uppercase, lowercase, number, and special character",
              },
            })}
          />
          {errors.password && (
            <span className="error">{errors.password.message}</span>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input
            type="password"
            id="confirmPassword"
            autoComplete="new-password"
            disabled={isSubmitting}
            {...register("confirmPassword", {
              required: "Please confirm your password",
              validate: (value) =>
                value === password || "Passwords do not match",
            })}
          />
          {errors.confirmPassword && (
            <span className="error">{errors.confirmPassword.message}</span>
          )}
        </div>

        <div>
          <label htmlFor="displayName">Display Name (optional):</label>
          <input
            type="text"
            id="displayName"
            autoComplete="name"
            disabled={isSubmitting}
            {...register("displayName", {
              maxLength: {
                value: 100,
                message: "Display name must be less than 100 characters",
              },
            })}
          />
          {errors.displayName && (
            <span className="error">{errors.displayName.message}</span>
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
          {isSubmitting ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p>
        Already have an account? <a href="/login">Login here</a>
      </p>
    </div>
  );
}

export default RegisterPage;
