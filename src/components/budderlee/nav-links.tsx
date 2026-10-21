"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./shop/cart-store";
import s from "./budderlee.module.css";

export const BUDDERLEE_SECTIONS = [
  { href: "/budderlee/village", label: "Explore the Village" },
  { href: "/budderlee/residents", label: "Meet the Residents" },
  { href: "/budderlee/tales", label: "Tales of Budderlee" },
  { href: "/budderlee/post", label: "The Budderlee Post" },
  { href: "/budderlee/shop", label: "The Village Store" },
];

export function BudderleeNav() {
  const path = usePathname();
  const basket = useCart().reduce((n, l) => n + l.quantity, 0);
  return (
    <nav className={s.nav} aria-label="Budderlee">
      <div className={s.navList}>
        {BUDDERLEE_SECTIONS.map((l) => {
          const active = path === l.href || path.startsWith(`${l.href}/`);
          const showBasket = l.href === "/budderlee/shop" && basket > 0;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`${s.navLink} ${active ? s.navLinkActive : ""}`}
              aria-current={active ? "page" : undefined}
            >
              {l.label}
              {showBasket && (
                <span className={s.basketCount}>
                  {basket}
                  <span className="sr-only"> in your basket</span>
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
