import type { Payload } from "payload";
import type { Subscriber } from "@/payload-types";
import { currentPaymentMailing, formatDollars, type PaymentMailing } from "./budderlee-post";
import { notifyStudio } from "./budderlee-post-emails";
import { SITE_URL } from "./site-url";

// Who has paid for a mailing. Renewals run from the 1st to the cutoff and
// each pays for next month's package; the Fulfillment page shows the count
// as it fills in, and Barbara gets one summary email the day after the
// cutoff instead of a note per charge.

export type PaymentCycle = {
  mailing: PaymentMailing;
  paid: Subscriber[];
  /** Still billed (active or past due) with no payment for this mailing. */
  unpaid: Subscriber[];
  /** Dollars, from each paid subscriber's latest payment. */
  collected: number;
};

export async function getPaymentCycle(payload: Payload, now = new Date()): Promise<PaymentCycle> {
  const mailing = currentPaymentMailing(now);
  const [paid, unpaid] = await Promise.all([
    payload.find({
      collection: "subscribers",
      where: {
        paidForMailing: { greater_than_equal: mailing.from.toISOString(), less_than: mailing.until.toISOString() },
      },
      pagination: false,
      overrideAccess: true,
    }),
    payload.find({
      collection: "subscribers",
      where: {
        and: [
          { status: { in: ["active", "past_due"] } },
          {
            or: [
              { paidForMailing: { exists: false } },
              { paidForMailing: { less_than: mailing.from.toISOString() } },
            ],
          },
        ],
      },
      pagination: false,
      overrideAccess: true,
    }),
  ]);
  return {
    mailing,
    paid: paid.docs,
    unpaid: unpaid.docs,
    collected: paid.docs.reduce((sum, s) => sum + (s.lastPaymentAmount ?? 0), 0),
  };
}

function who(s: Pick<Subscriber, "name" | "email">) {
  return s.name ? `${s.name} <${s.email}>` : s.email;
}

/** The monthly payments email to Barbara. */
export async function sendPaymentSummary(payload: Payload, opts: { cutoffDay: number; testMode: boolean; now?: Date }) {
  const now = opts.now ?? new Date();
  const cycle = await getPaymentCycle(payload, now);
  const monthAgo = new Date(now);
  monthAgo.setUTCMonth(monthAgo.getUTCMonth() - 1);
  const [joined, canceled] = await Promise.all([
    payload.find({
      collection: "subscribers",
      where: { startedAt: { greater_than_equal: monthAgo.toISOString() } },
      pagination: false,
      overrideAccess: true,
    }),
    payload.find({
      collection: "subscribers",
      where: { canceledAt: { greater_than_equal: monthAgo.toISOString() } },
      pagination: false,
      overrideAccess: true,
    }),
  ]);

  const testNote = opts.testMode ? " (TEST MODE)" : "";
  const total = cycle.paid.length + cycle.unpaid.length;
  const { label } = cycle.mailing;
  const unpaidLines = cycle.unpaid.map((s) =>
    s.status === "past_due"
      ? `- ${who(s)}: past due. Stripe is retrying the card and has emailed them.`
      : `- ${who(s)}: no payment recorded for ${label}. Check their subscription in Stripe.`,
  );

  await notifyStudio(`Budderlee Post payments for ${label}: ${cycle.paid.length} of ${total} paid${testNote}`, [
    `Renewals for the ${label} mailing closed on the ${opts.cutoffDay}th.${testNote}`,
    `Paid: ${cycle.paid.length} subscriber${cycle.paid.length === 1 ? "" : "s"}, ${formatDollars(Math.round(cycle.collected * 100))} collected.`,
    "",
    ...(cycle.unpaid.length
      ? [`Not paid (${cycle.unpaid.length}):`, ...unpaidLines]
      : ["Everyone still subscribed has paid."]),
    "",
    joined.docs.length ? `New this month (${joined.docs.length}): ${joined.docs.map((s) => s.name ?? s.email).join(", ")}` : "",
    canceled.docs.length ? `Canceled this month (${canceled.docs.length}): ${canceled.docs.map((s) => s.name ?? s.email).join(", ")}` : "",
    "",
    `Subscribers: ${SITE_URL}/admin/collections/subscribers`,
    `Fulfillment: ${SITE_URL}/admin/fulfillment`,
  ]);
  return { mailing: label, paid: cycle.paid.length, unpaid: cycle.unpaid.length };
}
