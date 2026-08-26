import Link from "next/link";
import React from "react";

export function AnalyticsNavLink() {
  return (
    <Link className="nav__link analytics-nav-link" href="/admin/analytics">
      Analytics
    </Link>
  );
}
