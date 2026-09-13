import { NextResponse } from "next/server";
import { getPayloadClient } from "@/lib/payload";
import { adminFromRequest, generateShippingList, isSameOrigin } from "@/lib/budderlee-post-fulfillment";

// "Generate shipping list" on the Fulfillment page. Admin only.
export async function POST(request: Request) {
  const back = (msg: string, kind: "ok" | "error" = "ok") =>
    NextResponse.redirect(new URL(`/admin/fulfillment?${kind}=${encodeURIComponent(msg)}`, request.url), 303);

  const payload = await getPayloadClient();
  if (!payload) return back("The database isn't available right now.", "error");
  if (!isSameOrigin(request)) return back("That request didn't come from the admin.", "error");
  if (!(await adminFromRequest(payload, request))) {
    return NextResponse.redirect(new URL("/admin/login?redirect=%2Fadmin%2Ffulfillment", request.url), 303);
  }

  const form = await request.formData();
  const issueId = String(form.get("issue") ?? "");
  if (!issueId) return back("No issue was chosen.", "error");

  try {
    const r = await generateShippingList(payload, issueId);
    const parts = [`Added ${r.added} to the shipping list`];
    if (r.alreadyListed) parts.push(`${r.alreadyListed} already on it`);
    parts.push(`${r.total} in total`);
    if (r.missingAddress) parts.push(`${r.missingAddress} without a street address, check those rows`);
    return back(parts.join(". ") + ".");
  } catch (err) {
    console.error("[fulfillment/generate]", err);
    return back(`Could not generate the list: ${err instanceof Error ? err.message : String(err)}`, "error");
  }
}
