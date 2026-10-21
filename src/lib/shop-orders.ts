import type Stripe from "stripe";
import type { Payload } from "payload";
import { FROM_EMAIL, TO_EMAIL, resend } from "./resend";
import { decodeOrderLines } from "./shop";

// A paid Village Store order: lower the stock of what was bought and tell
// Barbara what to mail and where. Stock is lowered once per order; the
// PaymentIntent remembers it so a retried webhook doesn't count twice.

const STOCK_DONE_KEY = "shop_stock_updated";

export function isShopSession(session: Stripe.Checkout.Session) {
  return !!session.metadata?.shop_order;
}

type VariantRow = { id?: string | null; label: string; price: number; stock?: number | null };

async function lowerStock(payload: Payload, session: Stripe.Checkout.Session) {
  for (const line of decodeOrderLines(session.metadata?.shop_order)) {
    const { docs } = await payload.find({
      collection: "products",
      where: { "variants.id": { equals: line.variantId } },
      limit: 1,
      depth: 0,
    });
    const product = docs[0] as { id: number; name: string; variants?: VariantRow[] } | undefined;
    if (!product?.variants) {
      console.error(`[shop] Option ${line.variantId} from session ${session.id} is no longer in the shop.`);
      continue;
    }
    const target = product.variants.find((v) => v.id === line.variantId);
    if (!target || target.stock == null) continue; // no limit kept for this option
    await payload.update({
      collection: "products",
      id: product.id,
      data: {
        variants: product.variants.map((v) =>
          v.id === line.variantId ? { ...v, stock: Math.max(0, (v.stock ?? 0) - line.quantity) } : v,
        ),
      },
    });
  }
}

export async function handleShopCheckoutCompleted(
  stripe: Stripe,
  payload: Payload,
  session: Stripe.Checkout.Session,
  livemode: boolean,
) {
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  const pi = paymentIntentId ? await stripe.paymentIntents.retrieve(paymentIntentId) : null;
  if (pi?.metadata?.[STOCK_DONE_KEY]) return; // already handled on an earlier delivery

  await lowerStock(payload, session);
  if (pi) await stripe.paymentIntents.update(pi.id, { metadata: { [STOCK_DONE_KEY]: new Date().toISOString() } });

  // Email failure must not fail the webhook: the sale is already recorded.
  if (!resend) {
    console.log(`[shop] Order ${session.id} paid; Resend not configured, no email sent.`);
    return;
  }
  try {
    const fresh = await stripe.checkout.sessions.retrieve(session.id, { expand: ["line_items"] });
    const items = (fresh.line_items?.data ?? []).map((li) => `  ${li.quantity} × ${li.description}`);
    const shipping = fresh.collected_information?.shipping_details;
    const address = shipping?.address ?? fresh.customer_details?.address;
    const addressLines = address
      ? [
          shipping?.name ?? fresh.customer_details?.name,
          address.line1,
          address.line2,
          [address.city, address.state, address.postal_code].filter(Boolean).join(", "),
          address.country,
        ].filter(Boolean)
      : [];
    const amount = fresh.amount_total != null ? `$${(fresh.amount_total / 100).toFixed(2)}` : "amount unavailable";
    const buyer = fresh.customer_details;
    const testNote = livemode ? "" : " (TEST MODE — not a real sale)";

    await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      subject: `Village Store order from ${buyer?.name ?? "a customer"}${testNote}`,
      text: [
        `A Village Store order just came in for ${amount}.${testNote}`,
        ``,
        `To pack:`,
        ...items,
        ``,
        `Buyer: ${buyer?.name ?? "name unavailable"} <${buyer?.email ?? "email unavailable"}>`,
        addressLines.length ? `Ship to:\n${addressLines.join("\n")}` : `Shipping address: see the Stripe dashboard`,
        ``,
        `When it's in the mail, use Mark shipped on the Orders page in the admin to email the buyer.`,
        `Stripe checkout session: ${session.id}`,
      ].join("\n"),
    });
  } catch (err) {
    console.error(`[shop] Order email failed (session ${session.id}):`, err);
  }
}
