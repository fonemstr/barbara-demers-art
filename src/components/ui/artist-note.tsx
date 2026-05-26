import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * "Artist's Note" — soft badge that carries the warmth
 * of the brand. Use sparingly to explain the *why* behind a piece.
 */
export function ArtistNote({
  children,
  icon = "🌱",
  rotate = 0,
  className,
}: {
  children: ReactNode;
  icon?: string;
  rotate?: number;
  className?: string;
}) {
  return (
    <span
      style={rotate ? { transform: `rotate(${rotate}deg)` } : undefined}
      className={cn(
        "inline-flex items-center gap-2 self-start rounded-full bg-secondary-container text-on-secondary-container px-4 py-2",
        "font-[family-name:var(--font-be-vietnam)] text-sm leading-none",
        className
      )}
    >
      {icon && <span aria-hidden>{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
