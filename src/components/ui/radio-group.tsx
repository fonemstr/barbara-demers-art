"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type RadioGroupOption = {
  value: string;
  label: ReactNode;
  description?: ReactNode;
};

/**
 * RadioGroup rendered as soft pill cards — per DESIGN.md §5 Chips
 * (rounded-full, "love-note" feel) with a selected state that uses
 * primary-container-dim to stay on-palette.
 */
export function RadioGroup({
  name,
  options,
  value,
  onChange,
  columns = 2,
  className,
}: {
  name: string;
  options: RadioGroupOption[];
  value?: string;
  onChange?: (v: string) => void;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}) {
  const gridCols =
    columns === 1
      ? "grid-cols-1"
      : columns === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : columns === 3
          ? "grid-cols-1 sm:grid-cols-3"
          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div role="radiogroup" className={cn("grid gap-3", gridCols, className)}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <label
            key={opt.value}
            className={cn(
              "cursor-pointer rounded-[20px] px-5 py-4 transition-all duration-[160ms] ease-[cubic-bezier(.22,1,.36,1)]",
              "ring-1 ring-inset",
              selected
                ? "bg-primary-container-dim ring-[color:var(--primary)] text-on-primary-container"
                : "bg-surface-container-low ring-[color:var(--outline-variant)] text-on-surface hover:bg-surface-container"
            )}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={selected}
              onChange={() => onChange?.(opt.value)}
              className="sr-only"
            />
            <div className="font-medium text-[15px]">{opt.label}</div>
            {opt.description && (
              <div
                className={cn(
                  "text-[13px] mt-1",
                  selected ? "text-on-primary-container/80" : "text-on-surface-muted"
                )}
              >
                {opt.description}
              </div>
            )}
          </label>
        );
      })}
    </div>
  );
}
