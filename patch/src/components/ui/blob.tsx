import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * The Artist's Blob — a non-interactive, organic background shape used
 * behind portraits and testimonials. Absolute-positioned inside a
 * `relative` parent. Colour defaults to the warm cream variant.
 */
export function Blob({
  color = "var(--surface-variant)",
  size = 400,
  style,
  className,
}: {
  color?: string;
  size?: number;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn("blob", className)}
      style={{
        width: size,
        height: size,
        background: color,
        ...style,
      }}
    />
  );
}
