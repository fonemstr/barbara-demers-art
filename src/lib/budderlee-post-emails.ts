import { FROM_EMAIL, TO_EMAIL, resend } from "./resend";
import { SITE_URL } from "./site-url";
import { BUDDERLEE_POST } from "./budderlee-post";

// Emails for The Budderlee Post. Stripe sends receipts, renewal notices,
// failed-payment retries, and expiring-card warnings itself; these are
// the human ones: the welcome, the manage link, and Barbara's heads-ups.

const site = SITE_URL.replace(/^https?:\/\//, "");

function shell(inner: string) {
  return `
  <div style="background:#fefcf4;padding:32px 16px;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:36px 32px;font-family:Georgia,'Times New Roman',serif;color:#3a3a33;">
      ${inner}
      <p style="margin:24px 0 0;font-size:16px;line-height:1.5;">
        Barbara J Demers<br/>
        <a href="${SITE_URL}" style="color:#8a7a2e;">${site}</a>
      </p>
    </div>
  </div>`;
}

const p = (text: string) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;">${text}</p>`;
const h1 = (text: string) => `<h1 style="margin:0 0 18px;font-size:26px;font-weight:normal;line-height:1.25;">${text}</h1>`;
const link = (href: string, text: string) => `<a href="${href}" style="color:#8a7a2e;">${text}</a>`;

async function send(to: string, subject: string, text: string, html: string, replyTo?: string) {
  if (!resend) {
    console.log(`[budderlee-post] Resend not configured; would have sent "${subject}" to ${to}.`);
    return;
  }
  try {
    const r = await resend.emails.send({ from: FROM_EMAIL, to, subject, text, html, replyTo });
    if (r.error) throw new Error(r.error.message);
  } catch (err) {
    console.error(`[budderlee-post] email "${subject}" to ${to} failed:`, err);
  }
}

export async function sendWelcomeEmail(opts: {
  to: string;
  name?: string;
  chargesNow: boolean;
  chargeDateLabel: string;
  firstMailingLabel: string;
  foundingMember: boolean;
}) {
  const hello = opts.name ? `Hello ${opts.name.split(" ")[0]},` : "Hello,";
  const manage = `${SITE_URL}/budderlee/post/manage`;
  const timing = opts.chargesNow
    ? `Your first package mails in the first week of ${opts.firstMailingLabel}. Your card was charged today, and it renews on the same day each month.`
    : `Nothing has been charged yet. Your card will be charged on ${opts.chargeDateLabel}, and your first package mails in the first week of ${opts.firstMailingLabel}. After that it renews monthly on the ${opts.chargeDateLabel.split(" ")[1]}.`;
  const founding = opts.foundingMember
    ? "You joined from the waitlist, so you're a founding member: the Founding Member sticker will be in your first package."
    : "";
  const text = [
    hello, "",
    `Welcome to ${BUDDERLEE_POST.name}.`, "",
    timing, "",
    founding, founding ? "" : null,
    "Every package has a resident of Budderlee on a 5×7 card with their story on the back, a chapter of Tales from Budderlee, a recipe card, a sticker, and a note from me.", "",
    `Need to change your address or card, or cancel? Ask for a link here: ${manage}`,
    "Want to skip a month? Just reply to this email.", "",
    "Barbara J Demers", site,
  ].filter((l) => l !== null).join("\n");
  const html = shell(
    h1(`Welcome to ${BUDDERLEE_POST.name}.`) +
    p(hello) +
    p(timing) +
    (founding ? p(founding) : "") +
    p("Every package has a resident of Budderlee on a 5×7 card with their story on the back, a chapter of <em>Tales from Budderlee</em>, a recipe card, a sticker, and a note from me.") +
    p(`Need to change your address or card, or cancel? ${link(manage, "Ask for a link here")}. Want to skip a month? Just reply to this email.`),
  );
  await send(opts.to, `Welcome to ${BUDDERLEE_POST.name}`, text, html, TO_EMAIL);
}

export async function sendPortalLinkEmail(opts: { to: string; url: string }) {
  const text = [
    `Here's your link to manage your ${BUDDERLEE_POST.name} subscription:`, "",
    opts.url, "",
    "It works for the next hour. You can update your address or card, or cancel there. If you didn't ask for this, you can ignore it.", "",
    "Barbara J Demers", site,
  ].join("\n");
  const html = shell(
    h1("Manage your subscription") +
    p(`Here's your link to manage your ${BUDDERLEE_POST.name} subscription. It works for the next hour.`) +
    p(link(opts.url, "Open your subscription")) +
    p(`<span style="font-size:13px;color:#8a887e;">You can update your address or card, or cancel there. If you didn't ask for this, you can ignore it.</span>`),
  );
  await send(opts.to, `Your link to manage ${BUDDERLEE_POST.name}`, text, html, TO_EMAIL);
}

export async function notifyStudio(subject: string, lines: string[]) {
  await send(TO_EMAIL, subject, lines.join("\n"), shell(lines.map((l) => (l ? p(l) : "")).join("")));
}
