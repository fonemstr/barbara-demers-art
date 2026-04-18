import type { LabelHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Label({
  className,
  children,
  required,
  ...rest
}: LabelHTMLAttributes<HTMLLabelElement> & {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label
      className={cn(
        "block text-[13px] font-medium text-on-surface tracking-[0.02em] mb-2",
        className
      )}
      {...rest}
    >
      {children}
      {required && <span className="text-on-surface-faint"> *</span>}
    </label>
  );
}

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p className="mt-2 text-[13px] text-[color:var(--error)]" role="alert">
      {children}
    </p>
  );
}

/**
 * Field: Label + slot + optional error, grouped with the right spacing.
 */
export function Field({
  label,
  required,
  error,
  children,
  className,
}: {
  label?: ReactNode;
  required?: boolean;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      {label && <Label required={required}>{label}</Label>}
      {children}
      <FieldError>{error}</FieldError>
    </div>
  );
}
