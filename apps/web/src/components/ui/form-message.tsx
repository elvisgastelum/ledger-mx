/**
 * Form message component - displays form-level error or success messages.
 * Used for root errors or general form feedback.
 */
import { type HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface FormMessageProps extends HTMLAttributes<HTMLParagraphElement> {
  type?: "error" | "success" | "info";
}

function FormMessage({
  className,
  type = "error",
  children,
  ...props
}: FormMessageProps) {
  if (!children) return null;

  const variantClasses = {
    error: "text-destructive",
    success: "text-green-600",
    info: "text-muted-foreground",
  };

  return (
    <p
      className={cn("text-sm font-medium", variantClasses[type], className)}
      {...props}
    >
      {children}
    </p>
  );
}

export { FormMessage };
