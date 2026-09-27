import { NextResponse } from "next/server";
import { FROM_EMAIL, TO_EMAIL, requireResend } from "@/lib/resend";
import { SITE_URL } from "@/lib/site-url";
import {
  ALL_INTERESTS,
  INTERESTS,
  type Interest,
  isInterest,
  resolveTopicIds,
} from "@/lib/newsletter-topics";

// What each interest brings, for the welcome email.
const EXPECT: Record<Interest, string> = {
  artwork: "first look at new original paintings, the stories behind them, and commission news",
  budderlee: "new residents arriving in Budderlee",
};

function expectLine(interests: Interest[]) {
  return interests.map((i) => EXPECT[i]).join(", plus ");
}

// Sent once, to first-time signups only. Broadcasts from the Resend
// dashboard carry their own unsubscribe link; this is a one-off hello.
function welcomeEmail(interests: Interest[]) {
  const expect = expectLine(interests);
  const text = [
    "Thank you for joining the collector list.",
    "",
    `Here's what to expect: ${expect}. Two emails a month at most. Every email has a link to change what you get.`,
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
        Thank you for joining. Here's what to expect: ${expect}. Two
        emails a month at most. Every email has a link to change what you
        get.
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
    const body = (await request.json()) as { email?: string; interests?: unknown };
    const { email } = body;
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    // No interests field (an older cached form) means everything.
    const picked = Array.isArray(body.interests)
      ? body.interests.filter(isInterest)
      : ALL_INTERESTS;
    const interests = ALL_INTERESTS.filter((i) => picked.includes(i));
    if (interests.length === 0) {
      return NextResponse.json(
        { error: "Pick at least one kind of news." },
        { status: 400 },
      );
    }

    const resend = requireResend();

    // Resend's contacts.create upserts silently for existing addresses
    // (verified live: no "already exists" error comes back), so knowing
    // whether this is a first-time signup needs an explicit lookup. A
    // failed lookup counts as new — worst case a repeat signup gets a
    // second hello, which beats a first-timer getting none.
    const existing = await resend.contacts
      .get({ email })
      .catch(() => ({ data: null }));
    const alreadySubscribed = !!existing.data;

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

    // Record which topics they want. contacts.create doesn't change
    // topics on an existing contact, so this is a separate update, which
    // also lets a repeat signup change their choice. Best effort: both
    // topics default to opt-in, so a failure means they get everything.
    try {
      const topicIds = await resolveTopicIds(resend);
      const { error: topicError } = await resend.contacts.topics.update({
        email,
        topics: ALL_INTERESTS.map((i) => ({
          id: topicIds[i],
          subscription: interests.includes(i) ? "opt_in" : "opt_out",
        })),
      });
      if (topicError) throw new Error(topicError.message);
    } catch (err) {
      console.error("[newsletter] topic preferences failed:", err);
    }

    // Welcome the subscriber, but only on a first-time signup — a repeat
    // signup already got one. Best effort: the contact is stored, so an
    // email hiccup must not fail the signup.
    if (!alreadySubscribed) {
      try {
        const { text, html } = welcomeEmail(interests);
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
        text: `${email} joined the studio list for: ${interests.map((i) => INTERESTS[i].name).join(" and ")}. The contact was added to Resend automatically — no action needed.`,
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
