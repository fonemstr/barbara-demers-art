import { NextResponse } from "next/server";
import { getPayloadClient } from "@/lib/payload";
import { requireStripe } from "@/lib/stripe";

// Stripe webhooks must read the raw body for signature verification.
export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = requireStripe();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing signature or webhook secret" },
      { status: 400 },
    );
  }

  const rawBody = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const slug = session.metadata?.painting_slug;
      if (!slug) {
        console.error(
          `[stripe-webhook] Session ${session.id} completed without a painting_slug — nothing marked sold.`,
        );
        break;
      }

      const payload = await getPayloadClient();
      if (!payload) {
        // Returning 500 makes Stripe retry, so a transient DB outage
        // doesn't silently leave the painting purchasable.
        console.error(
          `[stripe-webhook] Payload unavailable; could not mark "${slug}" sold (session ${session.id}).`,
        );
        return NextResponse.json(
          { error: "Database unavailable" },
          { status: 500 },
        );
      }

      // The Paintings afterChange hook revalidates the home, gallery, and
      // detail pages, so the site reflects the sale within the request.
      const result = await payload.update({
        collection: "paintings",
        where: { slug: { equals: slug } },
        data: { sold: true },
      });

      if (result.errors.length > 0) {
        console.error(
          `[stripe-webhook] Failed to mark "${slug}" sold (session ${session.id}):`,
          result.errors,
        );
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
      }

      if (result.docs.length === 0) {
        console.error(
          `[stripe-webhook] No painting found for slug "${slug}" (session ${session.id}) — mark it sold manually in /admin.`,
        );
      } else {
        console.log(
          `[stripe-webhook] Marked "${slug}" sold (session ${session.id}).`,
        );
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
