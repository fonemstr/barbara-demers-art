import { NextResponse } from "next/server";
import { requireStripe } from "@/lib/stripe";
import {
  BUDDERLEE_POST,
  getActiveSubscriberCount,
  getBudderleePostSettings,
  getSignupSchedule,
} from "@/lib/budderlee-post";
import { POST_METADATA_KEY } from "@/lib/budderlee-post-stripe";

// Starts a Stripe Checkout for The Budderlee Post. Signups on or before
// the cutoff are charged now; later ones have their billing date anchored
// to the next cutoff with nothing due until then, so nobody pays weeks
// before a package ships. An anchor rather than a trial, because Stripe
// words a trial as "24 days free" on its pages and this isn't a free sample.
export async function POST(request: Request) {
  try {
    const settings = await getBudderleePostSettings();
    if (settings.phase !== "open") {
      return NextResponse.json(
        { error: "Signups aren't open yet. Join the waitlist and you'll hear first." },
        { status: 409 },
      );
    }
    if (!settings.stripePriceId) {
      console.error("[post/checkout] Stripe price ID missing from The Budderlee Post settings.");
      return NextResponse.json(
        { error: "Signups aren't quite ready. Please try again soon." },
        { status: 503 },
      );
    }
    const count = await getActiveSubscriberCount();
    if (count >= settings.subscriberCap) {
      return NextResponse.json(
        { error: "Every spot is taken for now. Join the waitlist and you'll hear when one opens.", full: true },
        { status: 409 },
      );
    }

    const { email } = (await request.json().catch(() => ({}))) as { email?: string };
    const stripe = requireStripe();
    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";
    const schedule = getSignupSchedule(settings.cutoffDay);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: settings.stripePriceId, quantity: 1 }],
      shipping_address_collection: { allowed_countries: ["US"] },
      ...(email ? { customer_email: email.trim().toLowerCase() } : {}),
      ...(settings.collectTax ? { automatic_tax: { enabled: true } } : {}),
      subscription_data: {
        description: BUDDERLEE_POST.name,
        metadata: { [POST_METADATA_KEY]: "1" },
        ...(schedule.chargesNow
          ? {}
          : {
              billing_cycle_anchor: Math.floor(schedule.chargeDate.getTime() / 1000),
              proration_behavior: "none" as const,
            }),
      },
      metadata: {
        [POST_METADATA_KEY]: "1",
        first_mailing: schedule.firstMailingLabel,
        charges_now: schedule.chargesNow ? "1" : "0",
      },
      success_url: `${origin}/budderlee/post/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/budderlee/post`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    console.error("[post/checkout]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
