import { NextResponse } from "next/server";
import { getPayloadClient } from "@/lib/payload";
import { FROM_EMAIL, TO_EMAIL, resend } from "@/lib/resend";
import { SITE_URL } from "@/lib/site-url";
import { BUDDERLEE_POST, getBudderleePostSettings } from "@/lib/budderlee-post";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function confirmationEmail(name: string | undefined, nextMailing: string) {
  const hello = name ? `Hello ${name},` : "Hello,";
  const pageUrl = `${SITE_URL}/budderlee/post`;
  const text = [
    hello,
    "",
    `You're on the list for ${BUDDERLEE_POST.name}.`,
    "",
    "Here's what's coming: one resident of Budderlee in your mailbox every month. A 5×7 art card with the character's story on the back, a chapter of Tales from Budderlee, a recipe card, and a surprise sticker. The first mailing is planned for " +
      nextMailing +
      ".",
    "",
    "When signups open you'll hear from me first, and as a waitlist member you'll get the Founding Member sticker in your first package.",
    "",
    `Read more: ${pageUrl}`,
    "",
    "If this signup wasn't you, just ignore this note.",
    "",
    "Barbara J Demers",
    SITE_URL.replace(/^https?:\/\//, ""),
  ].join("\n");

  const html = `
  <div style="background:#fefcf4;padding:32px 16px;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:36px 32px;font-family:Georgia,'Times New Roman',serif;color:#3a3a33;">
      <h1 style="margin:0 0 18px;font-size:26px;font-weight:normal;line-height:1.25;">You're on the list.</h1>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">${hello}</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
        Thank you for your interest in ${BUDDERLEE_POST.name}. Here's what's
        coming: one resident of Budderlee in your mailbox every month. A 5×7
        art card with the character's story on the back, a chapter of
        <em>Tales from Budderlee</em>, a recipe card, and a surprise sticker.
        The first mailing is planned for ${nextMailing}.
      </p>
      <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">
        When signups open you'll hear from me first, and as a waitlist
        member you'll get the Founding Member sticker in your first package.
      </p>
      <p style="margin:0 0 24px;font-size:16px;line-height:1.8;">
        <a href="${pageUrl}" style="color:#8a7a2e;">Read more about ${BUDDERLEE_POST.name}</a>
      </p>
      <p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:#8a887e;">
        If this signup wasn't you, just ignore this note.
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
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      name?: string;
      source?: string;
      website?: string;
    };

    // Honeypot: real visitors never see this field. Bots that fill it get
    // a cheerful success and nothing stored.
    if (body.website) return NextResponse.json({ ok: true });

    const email = body.email?.trim().toLowerCase() ?? "";
    if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }
    const name = body.name?.trim().slice(0, 120) || undefined;
    const source = body.source?.trim().slice(0, 80) || "budderlee-post-page";

    const payload = await getPayloadClient();
    if (!payload) {
      console.error("[post/waitlist] Payload unavailable; signup not stored.");
      return NextResponse.json(
        { error: "The waitlist isn't available right now. Please try again later." },
        { status: 503 },
      );
    }

    // A repeat signup is a success from the visitor's point of view, and
    // shouldn't send a second confirmation.
    const existing = await payload.find({
      collection: "waitlist",
      where: { email: { equals: email } },
      limit: 1,
      overrideAccess: true,
    });
    if (existing.totalDocs > 0) {
      return NextResponse.json({ ok: true, already: true });
    }

    await payload.create({
      collection: "waitlist",
      data: { email, name, source, joinedAt: new Date().toISOString() },
      overrideAccess: true,
    });

    // The confirmation and the studio heads-up are best effort: the
    // signup is stored, so an email hiccup must not fail the request.
    if (resend) {
      const { nextMailing } = await getBudderleePostSettings();
      const { text, html } = confirmationEmail(name, nextMailing);
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          replyTo: TO_EMAIL,
          subject: `You're on the list for ${BUDDERLEE_POST.name}`,
          text,
          html,
        });
      } catch (err) {
        console.error("[post/waitlist] confirmation email failed:", err);
      }
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: TO_EMAIL,
          subject: `New waitlist signup: ${BUDDERLEE_POST.name}`,
          text: [
            `${name ? `${name} <${email}>` : email} joined the waitlist for ${BUDDERLEE_POST.name}.`,
            ``,
            `Total so far: ${existing.totalDocs + 1 > 0 ? "see Waitlist in /admin" : ""}`,
            `${SITE_URL}/admin/collections/waitlist`,
          ].join("\n"),
        });
      } catch (err) {
        console.error("[post/waitlist] studio notification failed:", err);
      }
    } else {
      console.log(
        `[post/waitlist] ${email} joined; Resend not configured, no email sent.`,
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[post/waitlist]", err);
    return NextResponse.json(
      { error: "Signup failed. Please try again." },
      { status: 500 },
    );
  }
}
