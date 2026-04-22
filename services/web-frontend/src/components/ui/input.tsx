import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "focus-ring h-9 w-full rounded-md border border-border bg-bg px-3 text-sm text-text placeholder:text-muted",
        className
      )}
      {...props}
    />
  );
}
