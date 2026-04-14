import { NextResponse } from "next/server";
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
      // TODO: persist sold state (DB / Payload / file). Until then, log so
      // Barbara can manually mark the painting sold in src/data/paintings.ts.
      console.log(
        `[stripe-webhook] Painting sold: ${slug} (session ${session.id})`,
      );
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
