import type { PropsWithChildren } from "react";
import { cn } from "../../lib/utils";

interface CardProps extends PropsWithChildren {
  className?: string;
}

export function Card({ className, children }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--dashboard-radius-card)] border border-[var(--dashboard-border)] bg-[var(--dashboard-card)] shadow-[0_12px_30px_rgba(15,23,42,0.035)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: CardProps) {
  return <div className={cn("px-4 pt-4", className)}>{children}</div>;
}

export function CardTitle({ className, children }: CardProps) {
  return <h3 className={cn("text-sm font-semibold text-text", className)}>{children}</h3>;
}

export function CardContent({ className, children }: CardProps) {
  return <div className={cn("p-4", className)}>{children}</div>;
}
