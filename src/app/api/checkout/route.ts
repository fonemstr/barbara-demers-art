import { NextResponse } from "next/server";
import {
  getPainting,
  PRINT_SHIPPING_RATE,
  SHIPPING_RATES,
} from "@/data/paintings";
import { printLabel } from "@/lib/utils";
import { requireStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const { slug, printOptionId } = (await request.json()) as {
      slug?: string;
      printOptionId?: string;
    };
    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const painting = await getPainting(slug);
    if (!painting) {
      return NextResponse.json({ error: "Painting not found" }, { status: 404 });
    }

    // Prints stay purchasable after the original sells; only block the
    // original itself.
    const printOption = printOptionId
      ? painting.prints?.find((opt) => opt.id === printOptionId)
      : undefined;
    if (printOptionId && !printOption) {
      return NextResponse.json(
        { error: "Print size not available" },
        { status: 404 },
      );
    }
    if (!printOption && painting.sold) {
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

    const productImages = painting.images
      .filter((src) => src.startsWith("http"))
      .slice(0, 1);

    const productMetadata: Record<string, string> = printOption
      ? { slug: painting.slug, print_option_id: printOption.id }
      : { slug: painting.slug };

    const lineItem = printOption
      ? {
          quantity: 1,
          adjustable_quantity: { enabled: true, minimum: 1, maximum: 10 },
          price_data: {
            currency: "usd",
            unit_amount: printOption.priceCents,
            product_data: {
              name: `${painting.title} — Giclée print`,
              description: `Archival giclée print · ${printLabel(printOption)}`,
              images: productImages,
              metadata: productMetadata,
            },
          },
        }
      : {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: painting.priceCents,
            product_data: {
              name: painting.title,
              description: `${painting.medium} · ${painting.widthIn}×${painting.heightIn} in`,
              images: productImages,
              metadata: productMetadata,
            },
          },
        };

    const shipping = printOption
      ? PRINT_SHIPPING_RATE
      : SHIPPING_RATES[painting.sizeTier];

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [lineItem],
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: shipping.label,
            fixed_amount: { amount: shipping.cents, currency: "usd" },
          },
        },
      ],
      shipping_address_collection: { allowed_countries: ["US"] },
      metadata: {
        painting_slug: painting.slug,
        ...(printOption
          ? {
              print_option_id: printOption.id,
              print_size: printLabel(printOption),
            }
          : {}),
      },
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
