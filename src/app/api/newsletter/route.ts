import { NextResponse } from "next/server";
import { FROM_EMAIL, TO_EMAIL, requireResend } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) as { email?: string };
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const resend = requireResend();

    // Store the signup as a Resend contact so broadcasts (new painting,
    // new Meadowbrook resident, studio news) can be sent to the whole
    // list from the Resend dashboard — no more hand-collected addresses.
    // RESEND_SEGMENT_ID is optional: set it to bucket studio-list signups
    // into a segment if other contact types are ever added.
    const segmentId = process.env.RESEND_SEGMENT_ID;
    const { error } = await resend.contacts.create({
      email,
      unsubscribed: false,
      ...(segmentId ? { segments: [{ id: segmentId }] } : {}),
    });

    // A repeat signup is a success from the visitor's point of view.
    if (error && !/already exist/i.test(error.message)) {
      console.error("[newsletter] contact create failed:", error);
      return NextResponse.json(
        { error: "Signup failed — please try again." },
        { status: 500 },
      );
    }

    // Keep the heads-up email to the studio. Best effort — the contact is
    // already stored, so a notification hiccup must not fail the signup.
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: TO_EMAIL,
        subject: "New newsletter signup",
        text: `${email} joined the studio list. The contact was added to Resend automatically — no action needed.`,
      });
    } catch (err) {
      console.error("[newsletter] notification email failed:", err);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Signup failed";
    console.error("[newsletter]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
