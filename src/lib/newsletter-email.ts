import type { Resend } from "resend";
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import { SITE_URL } from "@/lib/site-url";

// The collector list lives in Resend. Broadcasts can only target a
// segment, but signups land in the audience without segment membership —
// so before every send, the whole audience is synced into the target
// segment. That makes sends self-healing: nobody is silently skipped,
// and Resend still excludes unsubscribed contacts on its own.

const SEGMENT_NAME = /general|collector/i;

export async function resolveCollectorSegmentId(
  resend: Resend,
): Promise<string | null> {
  if (process.env.RESEND_SEGMENT_ID) return process.env.RESEND_SEGMENT_ID;
  const res = await resend.segments.list();
  const segments = res.data?.data ?? [];
  const named = segments.find((s) => SEGMENT_NAME.test(s.name));
  return (named ?? segments[0])?.id ?? null;
}

/** Add every audience contact to the segment (idempotent). Returns the contact count. */
export async function syncAllContactsIntoSegment(
  resend: Resend,
  segmentId: string,
): Promise<number> {
  let total = 0;
  let after: string | undefined;
  // Paginate defensively; the list is small today but shouldn't stay that way.
  for (let page = 0; page < 50; page++) {
    const res = await resend.contacts.list({ limit: 100, after });
    const contacts = res.data?.data ?? [];
    for (const contact of contacts) {
      total++;
      await resend.contacts.segments
        .add({ contactId: contact.id, segmentId })
        .catch(() => null);
    }
    if (!res.data?.has_more || contacts.length === 0) break;
    after = contacts[contacts.length - 1].id;
  }
  return total;
}

// Same visual shell as the welcome email: cream page, white card, serif.
export function renderNewsletterHtml(
  body: SerializedEditorState,
  { forTest }: { forTest: boolean },
): string {
  let inner = convertLexicalToHTML({ data: body, disableContainer: true });
  inner = inner
    // Media URLs come back site-relative; email clients need absolute.
    .replace(/src="\/api\/media\//g, `src="${SITE_URL}/api/media/`)
    // Email clients ignore stylesheets — style tags inline.
    .replace(/<img /g, '<img style="max-width:100%;height:auto;" ')
    .replace(/<a /g, '<a style="color:#8a7a2e;" ');

  // Resend substitutes the unsubscribe placeholder per-recipient in
  // broadcasts only, so tests (sent as a plain email) show a note instead.
  const unsubscribe = forTest
    ? '<span>(the unsubscribe link appears here in the real send)</span>'
    : '<a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#8a887e;">Unsubscribe</a>';

  return `
  <div style="background:#fefcf4;padding:32px 16px;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:36px 32px;font-family:Georgia,'Times New Roman',serif;color:#3a3a33;font-size:16px;line-height:1.6;">
      ${inner}
    </div>
    <div style="max-width:560px;margin:16px auto 0;text-align:center;font-family:Georgia,'Times New Roman',serif;font-size:13px;line-height:1.6;color:#8a887e;">
      Barbara J Demers ·
      <a href="${SITE_URL}" style="color:#8a887e;">${SITE_URL.replace(/^https?:\/\//, "")}</a>
      · ${unsubscribe}
    </div>
  </div>`;
}
