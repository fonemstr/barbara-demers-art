import Link from "next/link";
import type { ReactNode } from "react";
import s from "./budderlee.module.css";

/** The small leaf sprig under headings and in the footer. */
export function Ornament({ width = 46 }: { width?: number }) {
  return (
    <svg className={s.ornament} width={width} height={width * 0.3} viewBox="0 0 60 18" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
        <path d="M30 9 C22 9 14 7 4 8" />
        <path d="M30 9 C38 9 46 7 56 8" />
      </g>
      <g fill="currentColor">
        <ellipse cx="22" cy="6.5" rx="4" ry="1.6" transform="rotate(-25 22 6.5)" />
        <ellipse cx="15" cy="10.5" rx="3.6" ry="1.4" transform="rotate(20 15 10.5)" />
        <ellipse cx="9" cy="6.2" rx="3.2" ry="1.3" transform="rotate(-20 9 6.2)" />
        <ellipse cx="38" cy="6.5" rx="4" ry="1.6" transform="rotate(25 38 6.5)" />
        <ellipse cx="45" cy="10.5" rx="3.6" ry="1.4" transform="rotate(-20 45 10.5)" />
        <ellipse cx="51" cy="6.2" rx="3.2" ry="1.3" transform="rotate(20 51 6.2)" />
        <circle cx="30" cy="9" r="1.9" fill="#9a4a2c" />
      </g>
    </svg>
  );
}

/** A centered section heading with the sprig beneath it. */
export function SectionTitle({ children, as = "h2", className }: { children: ReactNode; as?: "h1" | "h2"; className?: string }) {
  const Tag = as;
  return (
    <div className={className}>
      <Tag className={s.sectionTitle}>{children}</Tag>
      <Ornament />
    </div>
  );
}

/** The concept's olive (or outlined) button with an arrow. */
export function BdButton({
  href,
  children,
  outline,
  arrow = !outline,
}: {
  href: string;
  children: ReactNode;
  outline?: boolean;
  arrow?: boolean;
}) {
  return (
    <Link href={href} className={`${s.button} ${outline ? s.buttonOutline : ""}`}>
      {children}
      {arrow && (
        <span className={s.arrow} aria-hidden="true">
          →
        </span>
      )}
    </Link>
  );
}

export function Rule() {
  return <hr className={s.rule} />;
}
