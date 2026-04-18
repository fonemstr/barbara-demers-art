import type { ReactNode, ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "dark" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center rounded-full font-semibold transition-all duration-200 ease-[cubic-bezier(.22,1,.36,1)] disabled:opacity-60 disabled:cursor-not-allowed";

const sizeMap: Record<Size, string> = {
  sm: "text-sm px-4 py-2",
  md: "text-[15px] px-6 py-3",
  lg: "text-base px-8 py-4",
};

const variantMap: Record<Variant, string> = {
  primary:
    "text-on-primary shadow-ambient-sm hover:brightness-105 [background:var(--gradient-primary)] hover:[background:var(--gradient-primary-hover)]",
  secondary:
    "bg-surface-container-highest text-primary hover:bg-surface-container-high",
  dark:
    "bg-on-surface text-surface hover:bg-on-surface-muted",
  ghost:
    "bg-transparent text-on-surface-muted hover:text-on-surface",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(base, sizeMap[size], variantMap[variant], className)}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: CommonProps & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      className={cn(base, sizeMap[size], variantMap[variant], className)}
      {...rest}
    >
      {children}
    </a>
  );
}
