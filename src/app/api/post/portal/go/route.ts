import { NextResponse } from "next/server";
import { requireStripe } from "@/lib/stripe";
import { SITE_URL } from "@/lib/site-url";
import { verifyPortalToken } from "@/lib/budderlee-post-portal";

// The link in the "manage my subscription" email lands here. A valid
// token opens a fresh Stripe Customer Portal session; anything else
// goes back to the manage page with a note.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const c = url.searchParams.get("c") ?? "";
  const e = url.searchParams.get("e") ?? "";
  const s = url.searchParams.get("s") ?? "";
  const customer = verifyPortalToken(c, e, s);
  if (!customer) {
    return NextResponse.redirect(`${SITE_URL}/budderlee/post/manage?expired=1`, 303);
  }
  try {
    const stripe = requireStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer,
      return_url: `${SITE_URL}/budderlee/post/manage?done=1`,
    });
    return NextResponse.redirect(session.url, 303);
  } catch (err) {
    console.error("[post/portal/go]", err);
    return NextResponse.redirect(`${SITE_URL}/budderlee/post/manage?error=1`, 303);
  }
}
