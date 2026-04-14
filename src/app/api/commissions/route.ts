import { NextResponse } from "next/server";
import { FROM_EMAIL, TO_EMAIL, requireResend } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, string>;
    const { name, email, subject, size, timeline, message } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const resend = requireResend();

    const html = `
      <h2>New commission inquiry</h2>
      <p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
      <p><strong>Subject of painting:</strong> ${escapeHtml(subject)}</p>
      <p><strong>Preferred size:</strong> ${escapeHtml(size || "—")}</p>
      <p><strong>Timeline:</strong> ${escapeHtml(timeline || "—")}</p>
      <hr />
      <p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
    `;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      replyTo: email,
      subject: `Commission inquiry — ${subject}`,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to send inquiry";
    console.error("[commissions]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
