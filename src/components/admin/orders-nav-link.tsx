import Link from "next/link";
import React from "react";

export function OrdersNavLink() {
  return (
    <Link className="nav__link orders-nav-link" href="/admin/orders">
      Orders
    </Link>
  );
}
