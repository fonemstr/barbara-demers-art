import type Stripe from "stripe";
import type { Payload } from "payload";
import { getBudderleePostSettings, getSignupSchedule } from "./budderlee-post";
import { notifyStudio, sendWelcomeEmail } from "./budderlee-post-emails";
import { SITE_URL } from "./site-url";

// Keeps the Subscribers collection in step with Stripe. Every function
// here is called from the Stripe webhook; the metadata flag marks which
// subscriptions are The Budderlee Post so other Stripe activity on the
// same account is left alone.

export const POST_METADATA_KEY = "budderlee_post";

type SubscriberStatus = "active" | "trialing" | "past_due" | "paused" | "canceled" | "incomplete";

export function isPostSession(session: Stripe.Checkout.Session): boolean {
  return session.mode === "subscription" && session.metadata?.[POST_METADATA_KEY] === "1";
}

export function isPostSubscription(sub: Stripe.Subscription): boolean {
  return sub.metadata?.[POST_METADATA_KEY] === "1";
}

// A signup after the cutoff is active in Stripe from day one, but has no
// invoice until its billing date on the next cutoff.
function firstChargePending(sub: Stripe.Subscription): boolean {
  return sub.status === "active" && !sub.latest_invoice;
}

function mapStatus(sub: Stripe.Subscription): SubscriberStatus {
  if (sub.pause_collection) return "paused";
  // Kept off the shipping list until the first charge, the same as a trial.
  if (firstChargePending(sub)) return "trialing";
  switch (sub.status) {
    case "active":
    case "trialing":
    case "past_due":
    case "paused":
    case "canceled":
      return sub.status;
    case "unpaid":
      return "past_due";
    default:
      return "incomplete";
  }
}

function unixToIso(n: number | null | undefined): string | null {
  return n ? new Date(n * 1000).toISOString() : null;
}

function customerId(c: string | Stripe.Customer | Stripe.DeletedCustomer | null): string | null {
  if (!c) return null;
  return typeof c === "string" ? c : c.id;
}

type Address = {
  name?: string | null;
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

function toAddress(name: string | null | undefined, a: Stripe.Address | null | undefined): Address | null {
  if (!a) return null;
  return {
    name: name ?? null,
    line1: a.line1 ?? null,
    line2: a.line2 ?? null,
    city: a.city ?? null,
    state: a.state ?? null,
    postalCode: a.postal_code ?? null,
    country: a.country ?? null,
  };
}

// The live webhook endpoint is pinned to an older API version than the
// SDK, so event payloads can carry the older field names. Objects fetched
// through the SDK always have the current ones.
type LegacySubscription = Stripe.Subscription & { current_period_end?: number | null };
type LegacyInvoice = Stripe.Invoice & { subscription?: string | { id: string } | null };

function subscriptionFields(sub: Stripe.Subscription) {
  const item = sub.items.data[0];
  const periodEnd = item?.current_period_end ?? (sub as LegacySubscription).current_period_end;
  const reason = sub.cancellation_details;
  const cancelReason = reason
    ? [reason.feedback, reason.comment].filter(Boolean).join(": ") || reason.reason || null
    : null;
  // Left untouched once the charge has happened, so the date stays on record.
  const firstChargeOn = sub.trial_end ?? (firstChargePending(sub) ? sub.billing_cycle_anchor : null);
  return {
    status: mapStatus(sub),
    currentPeriodEnd: unixToIso(periodEnd),
    ...(firstChargeOn ? { trialEnd: unixToIso(firstChargeOn) } : {}),
    canceledAt: unixToIso(sub.canceled_at),
    cancelReason,
  };
}

async function findBySubscriptionId(payload: Payload, id: string) {
  const res = await payload.find({
    collection: "subscribers",
    where: { stripeSubscriptionId: { equals: id } },
    limit: 1,
    overrideAccess: true,
  });
  return res.docs[0] ?? null;
}

/**
 * A finished Checkout in subscription mode. Creates the Subscriber,
 * copies the shipping address onto the Stripe customer so later portal
 * edits flow back through customer.updated, decides founding membership,
 * and sends the welcome.
 */
export async function handlePostCheckoutCompleted(
  stripe: Stripe,
  payload: Payload,
  eventSession: Stripe.Checkout.Session,
  livemode: boolean,
) {
  // Read the session fresh so the shipping details are where the SDK
  // expects them, whatever API version the event was rendered in.
  const session = await stripe.checkout.sessions.retrieve(eventSession.id);
  const subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  if (!subId) {
    console.error(`[budderlee-post] session ${session.id} completed without a subscription.`);
    return;
  }
  const sub = await stripe.subscriptions.retrieve(subId);
  const custId = customerId(session.customer) ?? customerId(sub.customer);
  const email = (session.customer_details?.email ?? session.customer_email ?? "").toLowerCase();
  const shippingDetails = session.collected_information?.shipping_details;
  const name = shippingDetails?.name ?? session.customer_details?.name ?? null;
  const address = toAddress(name, shippingDetails?.address ?? session.customer_details?.address);

  // Save the shipping address on the customer so the portal shows and
  // edits the same one, and so customer.updated keeps us in sync.
  if (custId && shippingDetails?.address) {
    try {
      await stripe.customers.update(custId, {
        shipping: { name: shippingDetails.name ?? name ?? "", address: shippingDetails.address as Stripe.AddressParam },
      });
    } catch (err) {
      console.error(`[budderlee-post] could not copy shipping to customer ${custId}:`, err);
    }
  }

  // Founding member: on the waitlist, and subscribed inside the window.
  const settings = await getBudderleePostSettings();
  let foundingMember = false;
  if (email) {
    const wl = await payload.find({
      collection: "waitlist",
      where: { email: { equals: email } },
      limit: 1,
      overrideAccess: true,
    });
    const row = wl.docs[0];
    const windowOpen = !settings.foundingWindowEnds || Date.now() < new Date(settings.foundingWindowEnds).getTime();
    if (row && windowOpen) foundingMember = true;
    if (row && !row.subscribedAt) {
      await payload
        .update({ collection: "waitlist", id: row.id, data: { subscribedAt: new Date().toISOString() }, overrideAccess: true })
        .catch((err) => console.error("[budderlee-post] waitlist stamp failed:", err));
    }
  }

  const fields = subscriptionFields(sub);
  const existing = await findBySubscriptionId(payload, sub.id);
  const data = {
    email,
    name,
    stripeCustomerId: custId,
    stripeSubscriptionId: sub.id,
    foundingMember,
    packagesSent: 0,
    startedAt: new Date().toISOString(),
    ...(address ? { shippingAddress: address } : {}),
    ...fields,
  };
  if (existing) {
    await payload.update({ collection: "subscribers", id: existing.id, data, overrideAccess: true });
  } else {
    await payload.create({ collection: "subscribers", data, overrideAccess: true });
  }

  const schedule = getSignupSchedule(settings.cutoffDay);
  const chargesNow = !sub.trial_end && !firstChargePending(sub);
  const testNote = livemode ? "" : " (TEST MODE)";
  await sendWelcomeEmail({
    to: email,
    name: name ?? undefined,
    chargesNow,
    chargeDateLabel: chargesNow ? "today" : schedule.chargeDateLabel,
    firstMailingLabel: session.metadata?.first_mailing ?? schedule.firstMailingLabel,
    foundingMember,
  });
  await notifyStudio(`New Budderlee Post subscriber: ${name ?? email}${testNote}`, [
    `${name ? `${name} <${email}>` : email} just subscribed to The Budderlee Post.${testNote}`,
    "",
    chargesNow ? "Charged today." : `First charge on ${schedule.chargeDateLabel}.`,
    `First package: ${session.metadata?.first_mailing ?? schedule.firstMailingLabel}.`,
    foundingMember ? "Founding member: include the Founding Member sticker in their first package." : "",
    address ? `Ships to: ${[address.line1, address.line2, [address.city, address.state, address.postalCode].filter(Boolean).join(", ")].filter(Boolean).join(", ")}` : "",
    "",
    `Subscribers in the admin: ${SITE_URL}/admin/collections/subscribers`,
    `Stripe: https://dashboard.stripe.com/${livemode ? "" : "test/"}subscriptions/${sub.id}`,
  ]);
}

/** Any change to a Budderlee Post subscription in Stripe. */
export async function handlePostSubscriptionEvent(
  payload: Payload,
  sub: Stripe.Subscription,
  eventType: string,
  livemode: boolean,
) {
  if (!isPostSubscription(sub)) return;
  const existing = await findBySubscriptionId(payload, sub.id);
  if (!existing) {
    // checkout.session.completed creates the row; created/updated can
    // arrive first and are safe to skip, the completion handler reads
    // the subscription fresh.
    console.log(`[budderlee-post] ${eventType} for ${sub.id} before the subscriber row exists; skipping.`);
    return;
  }
  const fields = subscriptionFields(sub);
  await payload.update({ collection: "subscribers", id: existing.id, data: fields, overrideAccess: true });

  const testNote = livemode ? "" : " (TEST MODE)";
  const who = existing.name ? `${existing.name} <${existing.email}>` : existing.email;
  if (fields.status === "canceled" && existing.status !== "canceled") {
    await notifyStudio(`Budderlee Post cancellation: ${existing.name ?? existing.email}${testNote}`, [
      `${who} canceled their subscription.${testNote}`,
      fields.cancelReason ? `Reason given: ${fields.cancelReason}` : "No reason given.",
      `Packages sent so far: ${existing.packagesSent ?? 0}.`,
      "",
      "They stay in the admin as Canceled and drop off the next shipping list.",
    ]);
  } else if (fields.status === "paused" && existing.status !== "paused") {
    await notifyStudio(`Budderlee Post paused: ${existing.name ?? existing.email}${testNote}`, [
      `${who} paused their subscription.${testNote} They drop off the shipping list until they resume.`,
    ]);
  }
}

/** A renewal charge failed. Stripe retries and emails them; Barbara just hears about it. */
export async function handlePostInvoiceFailed(payload: Payload, invoice: Stripe.Invoice, livemode: boolean) {
  const subRef =
    invoice.parent?.subscription_details?.subscription ?? (invoice as LegacyInvoice).subscription;
  const subId = typeof subRef === "string" ? subRef : subRef?.id;
  if (!subId) return;
  const existing = await findBySubscriptionId(payload, subId);
  if (!existing) return;
  const testNote = livemode ? "" : " (TEST MODE)";
  const amount = invoice.amount_due != null ? `$${(invoice.amount_due / 100).toFixed(2)}` : "the renewal";
  await notifyStudio(`Budderlee Post payment failed: ${existing.name ?? existing.email}${testNote}`, [
    `A charge of ${amount} for ${existing.name ? `${existing.name} <${existing.email}>` : existing.email} didn't go through.${testNote}`,
    "Stripe will retry over the next week and has emailed them to update their card. Nothing to do unless it stays past due.",
    invoice.hosted_invoice_url ? `Invoice: ${invoice.hosted_invoice_url}` : "",
  ]);
}

/** The subscriber changed their address in the portal. */
export async function handlePostCustomerUpdated(payload: Payload, customer: Stripe.Customer) {
  if (!customer.shipping?.address) return;
  const res = await payload.find({
    collection: "subscribers",
    where: { stripeCustomerId: { equals: customer.id } },
    limit: 10,
    overrideAccess: true,
  });
  if (res.docs.length === 0) return;
  const address = toAddress(customer.shipping.name, customer.shipping.address);
  for (const doc of res.docs) {
    await payload.update({
      collection: "subscribers",
      id: doc.id,
      data: { shippingAddress: address ?? undefined, ...(customer.name ? { name: customer.name } : {}) },
      overrideAccess: true,
    });
  }
}
