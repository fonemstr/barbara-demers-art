import { getPayloadClient } from "@/lib/payload";
import { stripe } from "@/lib/stripe";
import { getBudderleePostSettings, studioDay } from "@/lib/budderlee-post";
import { syncLatestPostPayment } from "@/lib/budderlee-post-stripe";
import { sendPaymentSummary } from "@/lib/budderlee-post-payments";

// Daily, from the GitHub Actions workflow (.github/workflows/budderlee-post-payments.yml).
// Re-reads every billed subscriber's latest payment from Stripe, which
// backfills and repairs anything the invoice.paid webhook missed, then on
// the day after the cutoff emails Barbara the month's payment summary.
// Add ?summary=1 to send the summary today. Authenticated with CRON_SECRET.

export const maxDuration = 300;

export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = await getPayloadClient();
  if (!payload) return Response.json({ error: "database unavailable" }, { status: 500 });
  const settings = await getBudderleePostSettings();

  let synced = 0;
  const failed: string[] = [];
  if (stripe) {
    const subs = await payload.find({
      collection: "subscribers",
      where: { status: { not_equals: "canceled" } },
      pagination: false,
      overrideAccess: true,
    });
    for (const sub of subs.docs) {
      try {
        if (await syncLatestPostPayment(stripe, payload, sub, settings.cutoffDay)) synced += 1;
      } catch (err) {
        console.error(`[post-payments] sync failed for subscriber ${sub.id}:`, err);
        failed.push(sub.email);
      }
    }
  }

  const force = new URL(req.url).searchParams.get("summary") === "1";
  const summary =
    force || studioDay() === settings.cutoffDay + 1
      ? await sendPaymentSummary(payload, {
          cutoffDay: settings.cutoffDay,
          testMode: !!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test"),
        })
      : null;

  return Response.json({ synced, failed, summary });
}
