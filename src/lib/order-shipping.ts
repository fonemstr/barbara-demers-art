import { FROM_EMAIL, TO_EMAIL, resend } from "./resend";
import { escapeHtml, h1, link, p, shell, site } from "./email-layout";

// PaymentIntent metadata keys for orders the studio ships itself
// (originals, and prints not sent to Lumaprints). Set from the admin
// Orders page.
export const SHIPPED_AT_KEY = "shipped_at";
export const TRACKING_KEY = "tracking_number";

type Carrier = { name: string; url: string };

/** Guesses the carrier from the tracking number's shape, for a tracking link. */
export function trackingCarrier(raw: string): Carrier | null {
  const n = raw.replace(/\s+/g, "").toUpperCase();
  if (/^1Z[0-9A-Z]{16}$/.test(n)) {
    return { name: "UPS", url: `https://www.ups.com/track?tracknum=${n}` };
  }
  if (/^(9[2-5]\d{18,24}|[A-Z]{2}\d{9}US)$/.test(n)) {
    return { name: "USPS", url: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${n}` };
  }
  if (/^(\d{12}|\d{15}|\d{20}|\d{22})$/.test(n)) {
    return { name: "FedEx", url: `https://www.fedex.com/fedextrack/?trknbr=${n}` };
  }
  return null;
}

type ShippedEmail = {
  to: string;
  name: string | null;
  /** Reads as the subject of "is on its way", e.g. "Your print of …". */
  item: string;
  plural: boolean;
  tracking: string;
};

export function shippedEmail(opts: ShippedEmail) {
  const hello = opts.name ? `Hello ${opts.name.split(" ")[0]},` : "Hello,";
  const carrier = opts.tracking ? trackingCarrier(opts.tracking) : null;
  const trackingLine = opts.tracking
    ? `Your ${carrier ? `${carrier.name} ` : ""}tracking number is ${opts.tracking}.`
    : "";
  const closing =
    "Thank you for giving my work a home. If anything arrives damaged or isn't right, just reply to this email and I'll take care of it.";

  const text = [
    hello,
    "",
    `${opts.item} ${opts.plural ? "are" : "is"} packed and on its way to you.`,
    ...(trackingLine ? ["", trackingLine, ...(carrier ? [`Track it here: ${carrier.url}`] : [])] : []),
    "",
    closing,
    "",
    "Barbara J Demers",
    site,
  ].join("\n");

  const item = escapeHtml(opts.item);
  const tracking = escapeHtml(opts.tracking);
  const html = shell(
    h1("Your order is on its way") +
      p(escapeHtml(hello)) +
      p(`${item} ${opts.plural ? "are" : "is"} packed and on its way to you.`) +
      (opts.tracking
        ? p(
            `Your ${carrier ? `${carrier.name} ` : ""}tracking number is <strong>${tracking}</strong>.` +
              (carrier ? ` ${link(carrier.url, "Track your package")}.` : ""),
          )
        : "") +
      p(closing),
  );
  return { subject: "Your order is on its way", text, html };
}

/**
 * Tells the buyer their order is on its way. Returns an error message
 * instead of throwing: the order is already marked shipped either way.
 */
export async function sendShippedEmail(opts: ShippedEmail): Promise<string | null> {
  if (!resend) return "Resend is not configured (RESEND_API_KEY).";
  const { subject, text, html } = shippedEmail(opts);
  try {
    const r = await resend.emails.send({
      from: FROM_EMAIL,
      to: opts.to,
      subject,
      text,
      html,
      replyTo: TO_EMAIL,
    });
    if (r.error) throw new Error(r.error.message);
    return null;
  } catch (err) {
    console.error(`[orders] shipped email to ${opts.to} failed:`, err);
    return err instanceof Error ? err.message : String(err);
  }
}
