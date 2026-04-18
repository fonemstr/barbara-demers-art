import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Text input styled per DESIGN.md §5:
 *   - Background: surface-container-low
 *   - Ghost border (20% outline, "faint pencil sketch")
 *   - On focus: background shifts to surface-container-highest,
 *     2px primary bottom indicator.
 * No 1px solid borders anywhere.
 */
export function Input({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-[16px] bg-surface-container-low px-4 py-3 text-[15px] text-on-surface",
        "placeholder:text-on-surface-faint",
        "transition-all duration-[160ms] ease-[cubic-bezier(.22,1,.36,1)]",
        // ghost border using ring so it doesn't collide with focus
        "ring-1 ring-inset ring-[color:var(--outline-variant)]",
        // focus state — primary bottom indicator + lifted fill
        "focus:outline-none focus:bg-surface-container-highest",
        "focus:ring-0 focus:shadow-[inset_0_-2px_0_0_var(--primary)]",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        className
      )}
      {...rest}
    />
  );
}
