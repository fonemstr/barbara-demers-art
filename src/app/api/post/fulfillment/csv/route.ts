import { NextResponse } from "next/server";
import { getPayloadClient } from "@/lib/payload";
import { adminFromRequest, buildShippingCsv } from "@/lib/budderlee-post-fulfillment";

// The shipping list as a CSV download. Admin only.
export async function GET(request: Request) {
  const payload = await getPayloadClient();
  if (!payload) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  if (!(await adminFromRequest(payload, request))) {
    return NextResponse.redirect(new URL("/admin/login?redirect=%2Fadmin%2Ffulfillment", request.url), 303);
  }
  const issueId = new URL(request.url).searchParams.get("issue") ?? "";
  if (!issueId) return NextResponse.json({ error: "Missing issue" }, { status: 400 });
  try {
    const { filename, csv } = await buildShippingCsv(payload, issueId);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[fulfillment/csv]", err);
    return NextResponse.json({ error: "Could not build the CSV" }, { status: 500 });
  }
}
