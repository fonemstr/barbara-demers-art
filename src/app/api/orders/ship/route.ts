import { NextResponse } from "next/server";
import { getPayloadClient } from "@/lib/payload";
import { adminFromRequest, isSameOrigin } from "@/lib/budderlee-post-fulfillment";
import { stripe } from "@/lib/stripe";
import { getPainting } from "@/data/paintings";
import { SHIPPED_AT_KEY, TRACKING_KEY, sendShippedEmail } from "@/lib/order-shipping";

// "Mark shipped" (and its undo) on the Orders page. Admin only. Orders
// live in Stripe, so the shipped date and tracking number are kept on the
// order's PaymentIntent metadata.
export async function POST(request: Request) {
  const form = await request.formData();
  const backField = String(form.get("back") ?? "");
  const backPath = backField.startsWith("/admin/orders") ? backField : "/admin/orders";
  const back = (msg: string, kind: "ok" | "error" = "ok") => {
    const url = new URL(backPath, request.url);
    url.searchParams.set(kind, msg);
    return NextResponse.redirect(url, 303);
  };

  const payload = await getPayloadClient();
  if (!payload) return back("The database isn't available right now.", "error");
  if (!isSameOrigin(request)) return back("That request didn't come from the admin.", "error");
  if (!(await adminFromRequest(payload, request))) {
    return NextResponse.redirect(new URL("/admin/login?redirect=%2Fadmin%2Forders", request.url), 303);
  }
  if (!stripe) return back("Stripe is not configured.", "error");

  const paymentIntent = String(form.get("payment_intent") ?? "");
  if (!paymentIntent.startsWith("pi_")) return back("No order was chosen.", "error");
  const undo = form.get("undo") === "1";
  // Stripe metadata values are capped at 500 characters.
  const tracking = String(form.get("tracking") ?? "").trim().slice(0, 200);
  const item = String(form.get("item") ?? "the order").slice(0, 200);
  const notify = form.get("notify") === "1";

  try {
    await stripe.paymentIntents.update(paymentIntent, {
      // An empty string removes a metadata key.
      metadata: undo
        ? { [SHIPPED_AT_KEY]: "", [TRACKING_KEY]: "" }
        : { [SHIPPED_AT_KEY]: new Date().toISOString(), [TRACKING_KEY]: tracking },
    });
    if (undo) return back(`${item} is back to not shipped.`);
    if (!notify) return back(`Marked ${item} shipped. No email was sent.`);
  } catch (err) {
    console.error("[orders/ship]", err);
    return back(`Could not update ${item}: ${err instanceof Error ? err.message : String(err)}`, "error");
  }

  // The order is marked shipped; from here a failure only means the
  // buyer wasn't told, which the banner says so Barbara can email them.
  try {
    const { data } = await stripe.checkout.sessions.list({
      payment_intent: paymentIntent,
      limit: 1,
      expand: ["data.line_items"],
    });
    const session = data[0];
    const to = session?.customer_details?.email;
    if (!session || !to) return back(`Marked ${item} shipped, but there's no buyer email to send to.`, "error");

    const meta = session.metadata ?? {};
    const title = (meta.painting_slug && (await getPainting(meta.painting_slug))?.title) || item;
    const quantity = session.line_items?.data[0]?.quantity ?? 1;
    const size = meta.print_size ? ` (${meta.print_size})` : "";
    const phrase = meta.shop_order
      ? "Your order from the Budderlee Village Store"
      : !meta.print_option_id
      ? `"${title}"`
      : quantity > 1
        ? `Your ${quantity} prints of "${title}"${size}`
        : `Your print of "${title}"${size}`;

    const failed = await sendShippedEmail({
      to,
      name: session.customer_details?.name ?? null,
      item: phrase,
      plural: !meta.shop_order && quantity > 1,
      tracking,
    });
    return failed
      ? back(`Marked ${item} shipped, but the email to ${to} failed: ${failed}`, "error")
      : back(`Marked ${item} shipped and emailed ${to}${tracking ? " the tracking number" : ""}.`);
  } catch (err) {
    console.error("[orders/ship]", err);
    return back(`Marked ${item} shipped, but the buyer could not be emailed: ${err instanceof Error ? err.message : String(err)}`, "error");
  }
}
