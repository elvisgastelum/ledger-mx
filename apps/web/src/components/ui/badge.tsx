/**
 * Badge component - a small label for categorization.
 * Supports multiple variants and sizes.
 */
import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "success"
    | "warning"
    | "outline";
}

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default:
    "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
  secondary:
    "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
  destructive:
    "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
  success:
    "border-transparent bg-success text-success-foreground hover:bg-success/80",
  warning:
    "border-transparent bg-warning text-warning-foreground hover:bg-warning/80",
  outline: "text-foreground",
};

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          variantClasses[variant],
          className,
        )}
        {...props}
      />
    );
  },
);

Badge.displayName = "Badge";

export { Badge };
export type { BadgeProps };
