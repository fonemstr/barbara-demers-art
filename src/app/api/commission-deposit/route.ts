import { NextResponse } from "next/server";
import { getCommissionTier } from "@/data/commissions";
import { requireStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const { tierId, subject } = (await request.json()) as {
      tierId?: string;
      subject?: string;
    };

    const tier = tierId ? getCommissionTier(tierId) : undefined;
    if (!tier) {
      return NextResponse.json({ error: "Unknown size tier" }, { status: 400 });
    }
    const trimmedSubject = subject?.trim();
    if (!trimmedSubject) {
      return NextResponse.json(
        { error: "Please describe the subject so Barbara can match your reservation to your conversation" },
        { status: 400 },
      );
    }

    const stripe = requireStripe();
    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: tier.depositCents,
            product_data: {
              name: `Commission deposit — ${tier.label} (${tier.sizeNote})`,
              description:
                "Reserves your spot on the commission schedule. Applied toward the final price; the balance is due when the painting is finished, before shipping.",
            },
          },
        },
      ],
      metadata: {
        commission_tier: tier.id,
        // Stripe metadata values are capped at 500 characters.
        commission_subject: trimmedSubject.slice(0, 480),
      },
      success_url: `${origin}/commissions/reserved?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/commissions#deposit`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    console.error("[commission-deposit]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
