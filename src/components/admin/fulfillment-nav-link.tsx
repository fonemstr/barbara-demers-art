import Link from "next/link";
import React from "react";

export function FulfillmentNavLink() {
  return (
    <Link className="nav__link fulfillment-nav-link" href="/admin/fulfillment">
      Fulfillment
    </Link>
  );
}
