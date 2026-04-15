import { NextResponse } from "next/server";
import { getPainting, SHIPPING_RATES } from "@/data/paintings";
import { requireStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const { slug } = (await request.json()) as { slug?: string };
    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const painting = await getPainting(slug);
    if (!painting) {
      return NextResponse.json({ error: "Painting not found" }, { status: 404 });
    }
    if (painting.sold) {
      return NextResponse.json(
        { error: "This painting has already sold" },
        { status: 409 },
      );
    }

    const stripe = requireStripe();
    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const shipping = SHIPPING_RATES[painting.sizeTier];

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: painting.priceCents,
            product_data: {
              name: painting.title,
              description: `${painting.medium} · ${painting.widthIn}×${painting.heightIn} in`,
              images: painting.images
                .filter((src) => src.startsWith("http"))
                .slice(0, 1),
              metadata: { slug: painting.slug },
            },
          },
        },
      ],
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: shipping.label,
            fixed_amount: { amount: shipping.cents, currency: "usd" },
          },
        },
      ],
      shipping_address_collection: { allowed_countries: ["US", "CA"] },
      metadata: { painting_slug: painting.slug },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/gallery/${painting.slug}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    console.error("[checkout]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
