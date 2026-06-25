/**
 * Register page route.
 * Uses react-hook-form for form state management.
 * Respects redirect query parameter for post-registration navigation.
 */
import { useEffect } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import { useAuth } from "../lib/auth-context";
import { getSafeRedirect } from "../lib/auth-utils";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

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
    control,
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
        data.rememberMe,
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
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            Create Your LedgerMx Account
          </CardTitle>
          <CardDescription>
            Sign up to start managing your finances
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
            aria-label="Registration Form"
          >
            {errors.root && (
              <div
                className="rounded-md bg-destructive/15 p-3 text-sm text-destructive"
                role="alert"
              >
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
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                disabled={isSubmitting}
                error={!!errors.password}
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
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                disabled={isSubmitting}
                error={!!errors.confirmPassword}
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (value) =>
                    value === password || "Passwords do not match",
                })}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name (optional)</Label>
              <Input
                id="displayName"
                type="text"
                autoComplete="name"
                disabled={isSubmitting}
                error={!!errors.displayName}
                {...register("displayName", {
                  maxLength: {
                    value: 100,
                    message: "Display name must be less than 100 characters",
                  },
                })}
              />
              {errors.displayName && (
                <p className="text-sm text-destructive">
                  {errors.displayName.message}
                </p>
              )}
            </div>

            <Controller
              name="rememberMe"
              control={control}
              render={({ field }) => (
                <label
                  htmlFor="rememberMe"
                  className="flex min-h-[44px] items-center space-x-2 cursor-pointer"
                >
                  <Checkbox
                    id="rememberMe"
                    checked={field.value === true}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true)
                    }
                    disabled={isSubmitting}
                    aria-invalid={!!errors.rememberMe}
                  />
                  <span className="text-sm">
                    Remember me (extends session to 30 days)
                  </span>
                </label>
              )}
            />

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm">
            Already have an account?{" "}
            <a href="/login" className="text-primary hover:underline">
              Login here
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default RegisterPage;
