/**
 * Loading State component - displays a loading spinner or skeleton.
 * Use for loading states while data is being fetched.
 */
import { cn } from "../../lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  text?: string;
  className?: string;
  size?: "sm" | "default" | "lg";
}

function LoadingState({
  text = "Loading...",
  className,
  size = "default",
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div
      className={cn(
        "flex min-h-[400px] flex-col items-center justify-center",
        className
      )}
    >
      <Loader2
        className={cn("animate-spin text-muted-foreground", sizeClasses[size])}
      />
      {text && (
        <p className="mt-4 text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  );
}

export { LoadingState };
