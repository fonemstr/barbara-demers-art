import { NextResponse } from "next/server";
import { getPayloadClient } from "@/lib/payload";
import { FROM_EMAIL, TO_EMAIL, resend } from "@/lib/resend";
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

      // Print sales never mark the original sold — prints are open stock.
      // Just tell Barbara what to print and where to ship it.
      const printSize = session.metadata?.print_size;
      if (session.metadata?.print_option_id) {
        if (resend) {
          const { getPainting } = await import("@/data/paintings");
          const title = (await getPainting(slug))?.title ?? slug;
          const amount =
            session.amount_total != null
              ? `$${(session.amount_total / 100).toFixed(2)}`
              : "amount unavailable";
          const buyer = session.customer_details;
          const address = buyer?.address;
          const addressLines = address
            ? [
                address.line1,
                address.line2,
                [address.city, address.state, address.postal_code]
                  .filter(Boolean)
                  .join(", "),
                address.country,
              ].filter(Boolean)
            : [];
          const testNote = event.livemode
            ? ""
            : " (TEST MODE — not a real sale)";

          try {
            await resend.emails.send({
              from: FROM_EMAIL,
              to: TO_EMAIL,
              subject: `Print sold: ${title}${printSize ? ` (${printSize})` : ""}${testNote}`,
              text: [
                `A giclée print of "${title}"${printSize ? ` at ${printSize}` : ""} just sold for ${amount}.${testNote}`,
                ``,
                `Buyer: ${buyer?.name ?? "name unavailable"} <${buyer?.email ?? "email unavailable"}>`,
                addressLines.length
                  ? `Ship to:\n${addressLines.join("\n")}`
                  : `Shipping address: see the Stripe dashboard`,
                ``,
                `Quantity and totals: https://dashboard.stripe.com/payments — session ${session.id}`,
                `The original painting's availability is unchanged.`,
              ].join("\n"),
            });
          } catch (err) {
            console.error(
              `[stripe-webhook] Print sale email failed for "${slug}" (session ${session.id}):`,
              err,
            );
          }
        } else {
          console.log(
            `[stripe-webhook] Print of "${slug}" sold (session ${session.id}); Resend not configured, no email sent.`,
          );
        }
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

      // Studio notification. The customer's receipt comes from Stripe
      // (enable "Successful payments" under Settings → Emails); this one
      // tells Barbara a painting sold and where to ship it. Email failure
      // must not 500 the webhook — the sale is already recorded.
      if (resend) {
        const title =
          (result.docs[0] as { title?: string } | undefined)?.title ?? slug;
        const amount =
          session.amount_total != null
            ? `$${(session.amount_total / 100).toFixed(2)}`
            : "amount unavailable";
        const buyer = session.customer_details;
        const address = buyer?.address;
        const addressLines = address
          ? [
              address.line1,
              address.line2,
              [address.city, address.state, address.postal_code]
                .filter(Boolean)
                .join(", "),
              address.country,
            ].filter(Boolean)
          : [];
        const testNote = event.livemode ? "" : " (TEST MODE — not a real sale)";

        try {
          await resend.emails.send({
            from: FROM_EMAIL,
            to: TO_EMAIL,
            subject: `Painting sold: ${title}${testNote}`,
            text: [
              `"${title}" just sold for ${amount}.${testNote}`,
              ``,
              `Buyer: ${buyer?.name ?? "name unavailable"} <${buyer?.email ?? "email unavailable"}>`,
              addressLines.length
                ? `Ship to:\n${addressLines.join("\n")}`
                : `Shipping address: see the Stripe dashboard`,
              ``,
              `The painting is now marked sold on the site.`,
              `Payment details: https://dashboard.stripe.com/payments — session ${session.id}`,
            ].join("\n"),
          });
        } catch (err) {
          console.error(
            `[stripe-webhook] Sale email failed for "${slug}" (session ${session.id}):`,
            err,
          );
        }
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
