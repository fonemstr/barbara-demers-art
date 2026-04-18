import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Small-caps editorial eyebrow label. Sits above headlines.
 */
export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-xs tracking-[0.24em] uppercase text-on-surface-subtle font-medium",
        className
      )}
    >
      {children}
    </p>
  );
}
