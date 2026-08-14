import { NextResponse } from "next/server";
import { FROM_EMAIL, TO_EMAIL, requireResend } from "@/lib/resend";
import { SITE_URL } from "@/lib/site-url";

// Sent once, to first-time signups only. Broadcasts from the Resend
// dashboard carry their own unsubscribe link; this is a one-off hello.
function welcomeEmail() {
  const text = [
    "Thank you for joining the collector list.",
    "",
    "Here's what to expect: first look at new original paintings, new residents arriving in Budderlee, the stories behind the paintings, and the occasional commission opening. Two emails a month at most.",
    "",
    `Browse available work: ${SITE_URL}/gallery`,
    `Meet the Residents of Budderlee: ${SITE_URL}/budderlee`,
    "",
    "If this signup wasn't you, just ignore this note. Every list email includes an unsubscribe link.",
    "",
    "Barbara J Demers",
    SITE_URL.replace(/^https?:\/\//, ""),
  ].join("\n");

  const html = `
  <div style="background:#fefcf4;padding:32px 16px;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:36px 32px;font-family:Georgia,'Times New Roman',serif;color:#3a3a33;">
      <h1 style="margin:0 0 18px;font-size:26px;font-weight:normal;line-height:1.25;">You're on the collector list.</h1>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
        Thank you for joining. Here's what to expect: first look at new
        original paintings, new residents arriving in Budderlee, the
        stories behind the paintings, and the occasional commission
        opening. Two emails a month at most.
      </p>
      <p style="margin:0 0 8px;font-size:16px;line-height:1.6;">
        While you're here:
      </p>
      <p style="margin:0 0 24px;font-size:16px;line-height:1.8;">
        <a href="${SITE_URL}/gallery" style="color:#8a7a2e;">Browse available work</a><br/>
        <a href="${SITE_URL}/budderlee" style="color:#8a7a2e;">Meet the Residents of Budderlee</a>
      </p>
      <p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:#8a887e;">
        If this signup wasn't you, just ignore this note. Every list email
        includes an unsubscribe link.
      </p>
      <p style="margin:0;font-size:16px;line-height:1.5;">
        Barbara J Demers<br/>
        <a href="${SITE_URL}" style="color:#8a7a2e;">${SITE_URL.replace(/^https?:\/\//, "")}</a>
      </p>
    </div>
  </div>`;

  return { text, html };
}

export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) as { email?: string };
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const resend = requireResend();

    // Store the signup as a Resend contact so broadcasts (new painting,
    // new Budderlee resident, studio news) can be sent to the whole
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

    // Welcome the subscriber, but only on a first-time signup — a repeat
    // signup already got one. Best effort: the contact is stored, so an
    // email hiccup must not fail the signup.
    const isNewContact = !error;
    if (isNewContact) {
      try {
        const { text, html } = welcomeEmail();
        await resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject: "Welcome to the collector list",
          text,
          html,
        });
      } catch (err) {
        console.error("[newsletter] welcome email failed:", err);
      }
    }

    // Keep the heads-up email to the studio.
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
