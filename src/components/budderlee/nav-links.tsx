"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import s from "./budderlee.module.css";

export const BUDDERLEE_SECTIONS = [
  { href: "/budderlee/village", label: "Explore the Village" },
  { href: "/budderlee/residents", label: "Meet the Residents" },
  { href: "/budderlee/tales", label: "Tales of Budderlee" },
  { href: "/budderlee/post", label: "The Budderlee Post" },
];

export function BudderleeNav() {
  const path = usePathname();
  return (
    <nav className={s.nav} aria-label="Budderlee">
      <div className={s.navList}>
        {BUDDERLEE_SECTIONS.map((l) => {
          const active = path === l.href || path.startsWith(`${l.href}/`);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`${s.navLink} ${active ? s.navLinkActive : ""}`}
              aria-current={active ? "page" : undefined}
            >
              {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
