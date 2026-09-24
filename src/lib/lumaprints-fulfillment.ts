import type Stripe from "stripe";
import { getPainting } from "@/data/paintings";
import { SITE_URL } from "@/lib/site-url";
import {
  lumaprintsConfig,
  resolveOptionIds,
  splitName,
  submitOrder,
} from "@/lib/lumaprints";

export type LumaprintsFulfillment =
  | { status: "submitted" | "already-submitted"; orderNumber: string; env: string }
  | { status: "not-sent"; reason: string };

// Recorded on the PaymentIntent so a retried webhook never orders twice.
const ORDER_NUMBER_KEY = "lumaprints_order_number";

/**
 * Orders a paid print from Lumaprints. Never throws and never retries: a
 * timed-out request may still have reached Lumaprints, so a retry could
 * print twice. The caller emails the studio either way, and a print that
 * could not be sent is placed by hand instead.
 */
export async function fulfillPrintWithLumaprints(
  stripe: Stripe,
  sessionId: string,
  livemode: boolean,
): Promise<LumaprintsFulfillment> {
  const config = lumaprintsConfig();
  if (!config) {
    return {
      status: "not-sent",
      reason: "Lumaprints is not configured (LUMAPRINTS_API_KEY, LUMAPRINTS_API_SECRET, LUMAPRINTS_STORE_ID).",
    };
  }
  // A test-mode Stripe payment must never become a real print order.
  if (!livemode && config.env === "production") {
    return {
      status: "not-sent",
      reason: "Test-mode payment; Lumaprints is set to production, so nothing was ordered.",
    };
  }

  try {
    // Read the session fresh so shipping details use the SDK's field names
    // whatever API version the webhook endpoint is pinned to.
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "payment_intent"],
    });
    const paymentIntent =
      session.payment_intent && typeof session.payment_intent === "object"
        ? session.payment_intent
        : null;
    const existing = paymentIntent?.metadata?.[ORDER_NUMBER_KEY];
    if (existing) {
      return { status: "already-submitted", orderNumber: existing, env: config.env };
    }

    const slug = session.metadata?.painting_slug;
    const printOptionId = session.metadata?.print_option_id;
    const painting = slug ? await getPainting(slug) : undefined;
    const printOption = painting?.prints?.find((opt) => opt.id === printOptionId);
    if (!painting || !printOption?.lumaprints) {
      return {
        status: "not-sent",
        reason: `Print size ${printOptionId} of "${slug}" is no longer set up for Lumaprints.`,
      };
    }

    const shipping = session.collected_information?.shipping_details;
    const address = shipping?.address;
    if (!address?.line1 || !address.city || !address.postal_code || !address.country) {
      return { status: "not-sent", reason: "The session has no shipping address." };
    }

    const rawFileUrl = printOption.lumaprints.fileUrl ?? painting.images[0];
    const imageUrl = rawFileUrl.startsWith("/") ? `${SITE_URL}${rawFileUrl}` : rawFileUrl;
    const optionIds = await resolveOptionIds(
      config,
      printOption.lumaprints.subcategoryId,
      printOption.lumaprints.options,
    );
    const quantity = session.line_items?.data[0]?.quantity ?? 1;

    const orderNumber = await submitOrder(config, {
      externalId: session.id,
      recipient: {
        ...splitName(shipping?.name ?? session.customer_details?.name),
        addressLine1: address.line1,
        ...(address.line2 ? { addressLine2: address.line2 } : {}),
        city: address.city,
        state: address.state ?? "",
        zipCode: address.postal_code,
        country: address.country,
        ...(session.customer_details?.phone ? { phone: session.customer_details.phone } : {}),
      },
      items: [
        {
          externalItemId: `${painting.slug}-${printOption.id}`.slice(0, 191),
          subcategoryId: printOption.lumaprints.subcategoryId,
          quantity,
          width: printOption.widthIn,
          height: printOption.heightIn,
          imageUrl,
          optionIds,
        },
      ],
    });

    if (paymentIntent) {
      await stripe.paymentIntents
        .update(paymentIntent.id, { metadata: { [ORDER_NUMBER_KEY]: orderNumber } })
        .catch((err) =>
          console.error(`[lumaprints] could not record order ${orderNumber} on ${paymentIntent.id}:`, err),
        );
    }
    return { status: "submitted", orderNumber, env: config.env };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[lumaprints] order for session ${sessionId} failed:`, err);
    return { status: "not-sent", reason: message };
  }
}
