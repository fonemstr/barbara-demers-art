import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({
  className,
  rows = 5,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={rows}
      className={cn(
        "w-full rounded-[20px] bg-surface-container-low px-4 py-3 text-[15px] leading-relaxed text-on-surface resize-y",
        "placeholder:text-on-surface-faint",
        "transition-all duration-[160ms] ease-[cubic-bezier(.22,1,.36,1)]",
        "ring-1 ring-inset ring-[color:var(--outline-variant)]",
        "focus:outline-none focus:bg-surface-container-highest",
        "focus:ring-0 focus:shadow-[inset_0_-2px_0_0_var(--primary)]",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        className
      )}
      {...rest}
    />
  );
}
