import { NextResponse } from "next/server";
import { getPayloadClient } from "@/lib/payload";
import { SITE_URL } from "@/lib/site-url";
import { sendPortalLinkEmail } from "@/lib/budderlee-post-emails";
import { makePortalToken } from "@/lib/budderlee-post-portal";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// "Send me a link to manage my subscription." Always answers the same
// way so nobody can learn which addresses are subscribed.
export async function POST(request: Request) {
  try {
    const { email: raw } = (await request.json().catch(() => ({}))) as { email?: string };
    const email = raw?.trim().toLowerCase() ?? "";
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const payload = await getPayloadClient();
    if (payload) {
      const res = await payload.find({
        collection: "subscribers",
        where: { email: { equals: email } },
        sort: "-startedAt",
        limit: 1,
        overrideAccess: true,
      });
      const sub = res.docs[0];
      if (sub?.stripeCustomerId) {
        const t = makePortalToken(sub.stripeCustomerId);
        const url = `${SITE_URL}/api/post/portal/go?c=${encodeURIComponent(t.c)}&e=${t.e}&s=${t.s}`;
        await sendPortalLinkEmail({ to: email, url });
      } else {
        console.log(`[post/portal] no subscriber for ${email}; nothing sent.`);
      }
    } else {
      console.error("[post/portal] Payload unavailable; no link sent.");
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[post/portal]", err);
    return NextResponse.json({ ok: true });
  }
}
