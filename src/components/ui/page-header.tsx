import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Eyebrow } from "./eyebrow";

/**
 * PageHeader — the canonical page intro block: eyebrow + serif
 * headline + optional lede. Used on every non-landing route.
 */
export function PageHeader({
  eyebrow,
  title,
  lede,
  align = "left",
  className,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  align?: "left" | "center";
  className?: string;
  children?: ReactNode;
}) {
  return (
    <header
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h1
        className={cn(
          "font-serif leading-[1.05] tracking-[-0.02em] text-on-surface text-balance",
          "text-5xl md:text-6xl lg:text-7xl",
          eyebrow && "mt-5"
        )}
      >
        {title}
      </h1>
      {lede && (
        <p className="mt-6 text-lg md:text-xl text-on-surface-muted leading-relaxed text-pretty">
          {lede}
        </p>
      )}
      {children && <div className="mt-8">{children}</div>}
    </header>
  );
}
