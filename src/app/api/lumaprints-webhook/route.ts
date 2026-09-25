import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { FROM_EMAIL, TO_EMAIL, resend } from "@/lib/resend";
import { stripe } from "@/lib/stripe";

// Lumaprints calls this when a print ships (its only event, "shipping").
// Subscribe under Developer > Webhooks in the Lumaprints dashboard with
// this URL and the LUMAPRINTS_WEBHOOK_USERNAME / _PASSWORD basic auth.
export const runtime = "nodejs";

type ShippingEvent = {
  orderNumber?: string | number;
  externalId?: string;
  shipments?: Array<{
    carrier?: string;
    shippingMethod?: string;
    trackingNumber?: string;
    shipmentDate?: string;
  }>;
};

function authorized(request: Request): boolean {
  const user = process.env.LUMAPRINTS_WEBHOOK_USERNAME;
  const pass = process.env.LUMAPRINTS_WEBHOOK_PASSWORD;
  if (!user || !pass) return false;
  const expected = Buffer.from(
    `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`,
  );
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

function trackingUrl(carrier: string | undefined, number: string): string | null {
  const c = (carrier ?? "").toLowerCase();
  const n = encodeURIComponent(number);
  if (c.includes("usps")) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${n}`;
  if (c.includes("fedex")) return `https://www.fedex.com/fedextrack/?trknbr=${n}`;
  if (c.includes("ups")) return `https://www.ups.com/track?tracknum=${n}`;
  return null;
}

// Lumaprints verifies the URL (and the basic auth) when subscribing.
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const event = (await request.json().catch(() => ({}))) as ShippingEvent;
  const shipments = (event.shipments ?? []).filter((s) => s.trackingNumber);
  if (!event.orderNumber || shipments.length === 0) {
    return NextResponse.json({ ok: true });
  }

  // Orders placed by the site use the Stripe Checkout Session ID as their
  // external ID; orders Barbara placed by hand have none, so no email.
  const sessionId = event.externalId?.startsWith("cs_") ? event.externalId : null;
  const session =
    sessionId && stripe
      ? await stripe.checkout.sessions.retrieve(sessionId).catch((err) => {
          console.error(`[lumaprints-webhook] could not load ${sessionId}:`, err);
          return null;
        })
      : null;
  const email = session?.customer_details?.email ?? session?.customer_email;
  console.log(
    `[lumaprints-webhook] order ${event.orderNumber} shipped (${sessionId ?? "no session"}).`,
  );
  if (!email || !resend) {
    return NextResponse.json({ ok: true });
  }

  const firstName = (session?.customer_details?.name ?? "").trim().split(/\s+/)[0];
  const printSize = session?.metadata?.print_size;
  const trackingLines = shipments.map((s) => {
    const url = trackingUrl(s.carrier, s.trackingNumber!);
    const how = [s.carrier, s.shippingMethod].filter(Boolean).join(", ");
    return `${how ? `${how}: ` : ""}${s.trackingNumber}${url ? `\n${url}` : ""}`;
  });

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      replyTo: TO_EMAIL,
      subject: "Your print from Barbara J Demers has shipped",
      text: [
        `Hi${firstName ? ` ${firstName}` : ""},`,
        ``,
        `Good news: your${printSize ? ` ${printSize}` : ""} print is on its way.`,
        ``,
        `Tracking:`,
        trackingLines.join("\n\n"),
        ``,
        `Thank you for bringing a little of the studio home. If anything arrives less than perfect, just reply to this email.`,
        ``,
        `Barbara`,
      ].join("\n"),
    });
  } catch (err) {
    // The shipment itself is fine; don't make Lumaprints retry over email.
    console.error(`[lumaprints-webhook] tracking email for ${event.orderNumber} failed:`, err);
  }
  return NextResponse.json({ ok: true });
}
