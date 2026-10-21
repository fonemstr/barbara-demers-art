import { NextResponse } from "next/server";
import { requireStripe } from "@/lib/stripe";
import { getBudderleePostSettings } from "@/lib/budderlee-post";
import {
  MAX_LINES,
  MAX_QUANTITY,
  encodeOrderLines,
  getProducts,
  getShippingSettings,
  shippingFor,
  type OrderLine,
} from "@/lib/shop";

// Checkout for the Budderlee Village Store: the whole cart in one Stripe
// payment with one shipping charge (set in Store Settings). Prices and stock come from the
// Products collection, never from the browser.
export async function POST(request: Request) {
  try {
    const { items } = (await request.json()) as {
      items?: Array<{ variantId?: unknown; quantity?: unknown }>;
    };
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Your basket is empty." }, { status: 400 });
    }
    if (items.length > MAX_LINES) {
      return NextResponse.json({ error: "That's more than one order can hold." }, { status: 400 });
    }

    const [products, shippingSettings] = await Promise.all([getProducts(), getShippingSettings()]);
    const lines: OrderLine[] = [];
    let subtotal = 0;
    const lineItems = [];
    const { collectTax } = await getBudderleePostSettings();
    const taxed = collectTax ? { tax_behavior: "exclusive" as const } : {};

    for (const item of items) {
      const variantId = String(item.variantId ?? "");
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
        return NextResponse.json({ error: "One of the quantities isn't right." }, { status: 400 });
      }
      const product = products.find((p) => p.variants.some((v) => v.id === variantId));
      const variant = product?.variants.find((v) => v.id === variantId);
      if (!product || !variant) {
        return NextResponse.json(
          { error: "Something in your basket is no longer in the shop. Please remove it and try again." },
          { status: 409 },
        );
      }
      if (variant.stock !== undefined && variant.stock < quantity) {
        const left = variant.stock;
        return NextResponse.json(
          {
            error:
              left > 0
                ? `Only ${left} left of ${product.name} (${variant.label}).`
                : `${product.name} (${variant.label}) has sold out.`,
          },
          { status: 409 },
        );
      }
      lines.push({ variantId, quantity });
      subtotal += variant.priceCents * quantity;
      const image = product.images[0]?.url;
      lineItems.push({
        quantity,
        price_data: {
          currency: "usd",
          unit_amount: variant.priceCents,
          ...taxed,
          product_data: {
            name: product.variants.length > 1 ? `${product.name} (${variant.label})` : product.name,
            ...(product.description ? { description: product.description.slice(0, 300) } : {}),
            ...(image?.startsWith("http") ? { images: [image] } : {}),
            metadata: { product_slug: product.slug, variant_id: variantId },
          },
        },
      });
    }

    const shipping = shippingFor(subtotal, shippingSettings);
    const stripe = requireStripe();
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: shipping.label,
            fixed_amount: { amount: shipping.cents, currency: "usd" },
            ...taxed,
          },
        },
      ],
      shipping_address_collection: { allowed_countries: ["US"] },
      ...(collectTax ? { automatic_tax: { enabled: true } } : {}),
      metadata: { shop_order: encodeOrderLines(lines) },
      success_url: `${origin}/budderlee/shop/thanks?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/budderlee/shop/basket`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[shop/checkout]", err);
    return NextResponse.json({ error: "Checkout couldn't start. Please try again." }, { status: 500 });
  }
}
