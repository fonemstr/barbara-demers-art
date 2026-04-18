import type { SelectHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Select({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <div className="relative">
      <select
        className={cn(
          "w-full appearance-none rounded-[16px] bg-surface-container-low px-4 py-3 pr-11 text-[15px] text-on-surface",
          "transition-all duration-[160ms] ease-[cubic-bezier(.22,1,.36,1)]",
          "ring-1 ring-inset ring-[color:var(--outline-variant)]",
          "focus:outline-none focus:bg-surface-container-highest",
          "focus:ring-0 focus:shadow-[inset_0_-2px_0_0_var(--primary)]",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          className
        )}
        {...rest}
      >
        {children}
      </select>
      {/* chevron */}
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-subtle"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="m5 8 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
