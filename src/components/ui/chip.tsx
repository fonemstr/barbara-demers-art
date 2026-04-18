import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Chip({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-secondary-container text-on-secondary-container px-3 py-1 text-xs font-medium",
        className
      )}
    >
      {children}
    </span>
  );
}
