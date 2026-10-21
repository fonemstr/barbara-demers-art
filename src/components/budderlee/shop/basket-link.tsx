"use client";

import Link from "next/link";
import { useCart } from "./cart-store";

/** "Your basket (3)" at the top of the shop pages, once something is in it. */
export function BasketLink() {
  const count = useCart().reduce((n, l) => n + l.quantity, 0);
  if (count === 0) return null;
  return (
    <Link href="/budderlee/shop/basket" className="text-[15px] underline underline-offset-4 hover:text-[var(--bd-olive)]">
      Your basket ({count})
    </Link>
  );
}
