import type { ReactNode, CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Section — wraps a full-bleed band with a surface tone and inner max-width.
 * Use `tone` to shift the paper layer; never use a 1px divider to separate
 * sections (DESIGN.md §6 Don't).
 */
export function Section({
  tone = "surface",
  pad = "lg",
  maxWidth = "6xl",
  className,
  innerClassName,
  children,
  style,
}: {
  tone?: "surface" | "low" | "container" | "variant";
  pad?: "sm" | "smt" | "md" | "lg" | "xl";
  maxWidth?: "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "full";
  className?: string;
  innerClassName?: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const toneMap = {
    surface: "bg-surface",
    low: "bg-surface-container-low",
    container: "bg-surface-container",
    variant: "bg-surface-variant",
  } as const;

  const padMap = {
    sm: "py-14",
    smt: "pt-5 pb-14",
    md: "py-20",
    lg: "py-24",
    xl: "py-32",
  } as const;

  const maxMap = {
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
    full: "max-w-none",
  } as const;

  return (
    <section className={cn("relative", toneMap[tone], padMap[pad], className)} style={style}>
      <div className={cn("mx-auto px-6", maxMap[maxWidth], innerClassName)}>
        {children}
      </div>
    </section>
  );
}
