import type { AdminViewServerProps } from "payload";
import type Stripe from "stripe";

import { DefaultTemplate } from "@payloadcms/next/templates";
import { redirect } from "next/navigation";
import Link from "next/link";
import React from "react";

import { stripe } from "@/lib/stripe";

// Orders live in Stripe, not the database: every sale is a paid checkout
// session. Reading them from Stripe shows the whole history, including
// orders from before this page existed. Budderlee Post subscriptions are
// left out; they have their own Subscribers list.

const PAGE_SIZE = 50;

type OrderKind = "original" | "print" | "commission";

type Order = {
  id: string;
  created: number;
  kind: OrderKind;
  item: string;
  detail: string | null;
  quantity: number;
  total: number | null;
  buyerName: string | null;
  buyerEmail: string | null;
  shipTo: string[];
  status: { label: string; tone: "ok" | "warn" | "muted" };
  lumaprintsOrder: string | null;
  refunded: "full" | "partial" | null;
  dashboardUrl: string | null;
};

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

function money(cents: number | null) {
  if (cents == null) return "—";
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function dateLabel(unix: number) {
  return new Date(unix * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
}

function toOrder(session: Stripe.Checkout.Session): Order {
  const meta = session.metadata ?? {};
  const kind: OrderKind = meta.commission_tier ? "commission" : meta.print_option_id ? "print" : "original";
  const line = session.line_items?.data[0];
  const pi = typeof session.payment_intent === "object" ? session.payment_intent : null;
  const charge = pi && typeof pi.latest_charge === "object" ? pi.latest_charge : null;

  // Commission deposits collect no address; for sales, prefer the shipping
  // address and fall back to the billing one.
  const shipping = session.collected_information?.shipping_details;
  const address = kind === "commission" ? null : (shipping?.address ?? session.customer_details?.address);
  const shipTo = address
    ? [
        shipping?.name ?? session.customer_details?.name,
        address.line1,
        address.line2,
        [address.city, address.state, address.postal_code].filter(Boolean).join(", "),
        address.country && address.country !== "US" ? address.country : null,
      ].filter((l): l is string => Boolean(l))
    : [];

  const lumaprintsOrder = pi?.metadata?.lumaprints_order_number ?? null;
  let status: Order["status"];
  if (kind === "commission") {
    status = { label: "Deposit paid", tone: "muted" };
  } else if (kind === "original") {
    status = { label: "Barbara ships", tone: "warn" };
  } else if (meta.print_fulfillment !== "lumaprints") {
    status = { label: "Barbara prints and ships", tone: "warn" };
  } else if (lumaprintsOrder) {
    status = { label: `Lumaprints #${lumaprintsOrder}`, tone: "ok" };
  } else {
    status = { label: "Not sent to Lumaprints; place by hand", tone: "warn" };
  }

  const refunded = charge?.refunded ? "full" : charge && charge.amount_refunded > 0 ? "partial" : null;
  const dashboardBase = `https://dashboard.stripe.com/${session.livemode ? "" : "test/"}`;

  return {
    id: session.id,
    created: session.created,
    kind,
    item: line?.description ?? meta.painting_slug ?? "Order",
    detail: kind === "commission" ? (meta.commission_subject ?? null) : (meta.print_size ?? null),
    quantity: line?.quantity ?? 1,
    total: session.amount_total,
    buyerName: session.customer_details?.name ?? null,
    buyerEmail: session.customer_details?.email ?? null,
    shipTo,
    status,
    lumaprintsOrder,
    refunded,
    dashboardUrl: pi ? `${dashboardBase}payments/${pi.id}` : null,
  };
}

const KIND_LABEL: Record<OrderKind, string> = {
  original: "Original",
  print: "Print",
  commission: "Commission deposit",
};

const FILTERS: { value: OrderKind | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "original", label: "Originals" },
  { value: "print", label: "Prints" },
  { value: "commission", label: "Commissions" },
];

async function loadOrders(client: Stripe, after: string | undefined) {
  const page = await client.checkout.sessions.list({
    status: "complete",
    limit: PAGE_SIZE,
    ...(after ? { starting_after: after } : {}),
    expand: ["data.line_items", "data.payment_intent.latest_charge"],
  });
  const orders = page.data
    .filter((s) => s.mode === "payment" && s.payment_status === "paid")
    .map(toOrder);
  return { orders, nextAfter: page.has_more ? page.data.at(-1)?.id : undefined };
}

function OrderRow({ order, adminRoute }: { order: Order; adminRoute: string }) {
  return (
    <tr>
      <td>
        <strong>{dateLabel(order.created)}</strong>
        <div className="fv-muted">{KIND_LABEL[order.kind]}</div>
      </td>
      <td>
        <strong>{order.item}</strong>
        {order.detail && <div className="fv-muted">{order.detail}</div>}
        {order.quantity > 1 && <div className="fv-muted">Quantity {order.quantity}</div>}
      </td>
      <td>
        {order.buyerName ?? "—"}
        {order.buyerEmail && (
          <div className="fv-muted">
            <a href={`mailto:${order.buyerEmail}`}>{order.buyerEmail}</a>
          </div>
        )}
      </td>
      <td>
        {order.shipTo.length ? (
          order.shipTo.map((l, i) => <div key={i}>{l}</div>)
        ) : (
          <span className="fv-muted">—</span>
        )}
      </td>
      <td className="ov-num">
        {money(order.total)}
        {order.refunded && (
          <div className="ov-pill ov-pill--warn">{order.refunded === "full" ? "Refunded" : "Partly refunded"}</div>
        )}
      </td>
      <td>
        <span className={`ov-pill ov-pill--${order.status.tone}`}>{order.status.label}</span>
        <div className="ov-links fv-muted">
          {order.dashboardUrl && (
            <a href={order.dashboardUrl} target="_blank" rel="noreferrer">
              Stripe
            </a>
          )}
          {order.lumaprintsOrder && (
            <a href="https://dashboard.lumaprints.com/order/list" target="_blank" rel="noreferrer">
              Lumaprints
            </a>
          )}
          {order.kind === "commission" && (
            <Link href={`${adminRoute}/collections/commissioned-portraits`}>Commissions</Link>
          )}
        </div>
      </td>
    </tr>
  );
}

export async function OrdersView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req } = initPageResult;
  const adminRoute = req.payload.config.routes.admin;

  if (!req.user) {
    redirect(`${adminRoute}/login?redirect=${encodeURIComponent(`${adminRoute}/orders`)}`);
  }

  const after = first(searchParams?.after);
  const kindParam = first(searchParams?.kind);
  const kind = FILTERS.find((f) => f.value === kindParam)?.value ?? "all";

  let orders: Order[] = [];
  let nextAfter: string | undefined;
  let error: string | null = null;
  if (!stripe) {
    error = "Stripe is not configured (STRIPE_SECRET_KEY), so orders can't be read.";
  } else {
    try {
      ({ orders, nextAfter } = await loadOrders(stripe, after));
    } catch (err) {
      console.error("[admin/orders]", err);
      error = `Couldn't load orders from Stripe: ${err instanceof Error ? err.message : "unknown error"}`;
    }
  }
  const testMode = process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") ?? false;
  const shown = kind === "all" ? orders : orders.filter((o) => o.kind === kind);
  const href = (q: { kind?: string; after?: string }) => {
    const qs = new URLSearchParams();
    if (q.kind && q.kind !== "all") qs.set("kind", q.kind);
    if (q.after) qs.set("after", q.after);
    return `${adminRoute}/orders${qs.size ? `?${qs}` : ""}`;
  };

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={req.user ?? undefined}
      visibleEntities={initPageResult.visibleEntities}
    >
      <div className="gutter gutter--left gutter--right fulfillment-view orders-view">
        <h1 className="fv-heading">Orders</h1>

        {testMode && (
          <div className="fv-banner fv-banner--error" role="status">
            Stripe is in test mode here, so these are test orders, not real sales.
          </div>
        )}
        {error && (
          <div className="fv-banner fv-banner--error" role="alert">
            {error}
          </div>
        )}

        <nav className="ov-filters" aria-label="Order type">
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              href={href({ kind: f.value, after })}
              className={`btn btn--size-small ${f.value === kind ? "btn--style-primary" : "btn--style-secondary"}`}
              aria-current={f.value === kind ? "page" : undefined}
            >
              {f.label}
            </Link>
          ))}
        </nav>

        <section className="fv-card">
          {shown.length === 0 ? (
            !error && (
              <p className="fv-muted">
                {nextAfter ? "None in this batch of orders." : after ? "No more orders." : "No orders yet."}
              </p>
            )
          ) : (
            <div className="fv-table-wrap">
              <table className="fv-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Item</th>
                    <th>Buyer</th>
                    <th>Ship to</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((order) => (
                    <OrderRow key={order.id} order={order} adminRoute={adminRoute} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="fv-muted fv-footnote">
            {after && (
              <>
                <Link href={href({ kind })}>Newest orders</Link> ·{" "}
              </>
            )}
            {nextAfter && (
              <>
                <Link href={href({ kind, after: nextAfter })}>Older orders</Link> ·{" "}
              </>
            )}
            Totals include shipping and tax. Budderlee Post subscriptions are under{" "}
            <Link href={`${adminRoute}/fulfillment`}>Fulfillment</Link>.
          </p>
        </section>
      </div>
    </DefaultTemplate>
  );
}
