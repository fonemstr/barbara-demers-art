import { NextResponse } from "next/server";
import { getPayloadClient } from "@/lib/payload";
import { adminFromRequest, isSameOrigin, markIssueShipped } from "@/lib/budderlee-post-fulfillment";

// "Mark all shipped" on the Fulfillment page. Admin only.
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
    const n = await markIssueShipped(payload, issueId);
    return back(n === 0 ? "Nothing was pending; the issue is marked shipped." : `Marked ${n} package${n === 1 ? "" : "s"} shipped and counted them for each subscriber.`);
  } catch (err) {
    console.error("[fulfillment/ship-all]", err);
    return back(`Could not mark the issue shipped: ${err instanceof Error ? err.message : String(err)}`, "error");
  }
}
