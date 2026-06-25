/**
 * Page Header component - consistent page title and description.
 * Use at the top of pages for consistent layout.
 */
import { type ReactNode } from "react";
import { cn } from "../../lib/utils";
import { Button } from "./button";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  children?: ReactNode;
  className?: string;
}

function PageHeader({
  title,
  description,
  action,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {children}
      </div>
      {action && (
        <Button onClick={action.onClick}>
          {action.icon && <span className="mr-2">{action.icon}</span>}
          {action.label}
        </Button>
      )}
    </div>
  );
}

export { PageHeader };
