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
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

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
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">Login to LedgerMx</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
            aria-label="Login Form"
          >
            {errors.root && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive" role="alert">
                {errors.root.message}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                disabled={isSubmitting}
                error={!!errors.email}
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Please enter a valid email address",
                  },
                })}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                disabled={isSubmitting}
                error={!!errors.password}
                {...register("password", {
                  required: "Password is required",
                })}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <label className="flex min-h-[44px] items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                disabled={isSubmitting}
                className="h-4 w-4 rounded border-input"
                {...register("rememberMe")}
              />
              <span className="text-sm">Remember me (extends session to 30 days)</span>
            </label>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Logging in..." : "Login"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm">
            Don't have an account? <a href="/register" className="text-primary hover:underline">Register here</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginPage;
