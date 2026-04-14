import { NextResponse } from "next/server";
import { FROM_EMAIL, TO_EMAIL, requireResend } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) as { email?: string };
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // v1: just email Barbara so she can add them to her list manually. When
    // the list grows, swap this for a Resend audience or ConvertKit.
    const resend = requireResend();
    await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      subject: "New newsletter signup",
      text: `${email} signed up for the studio list.`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Signup failed";
    console.error("[newsletter]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
