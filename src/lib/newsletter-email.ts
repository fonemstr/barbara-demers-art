import type { Resend } from "resend";
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import type { Media } from "@/payload-types";
import { absoluteMediaUrl } from "@/lib/social-direct";
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

// Text column of the email card: 560px card minus 32px padding each side.
const CONTENT_WIDTH = 496;

type LexicalNodeLike = { type?: string; value?: unknown; children?: unknown[] };

/** IDs of every picture placed in the body, so the caller can load them. */
export function collectUploadIds(body: SerializedEditorState): (number | string)[] {
  const ids = new Set<number | string>();
  const walk = (node: LexicalNodeLike) => {
    if (node.type === "upload") {
      const value = node.value;
      if (typeof value === "number" || typeof value === "string") ids.add(value);
      else if (value && typeof value === "object" && "id" in value) {
        ids.add((value as Media).id);
      }
    }
    for (const child of node.children ?? []) walk(child as LexicalNodeLike);
  };
  walk(body.root as LexicalNodeLike);
  return [...ids];
}

const escapeHTML = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// Email clients can't be trusted with <picture>, srcset, or stylesheets,
// and Outlook ignores max-width — so each picture is one plain <img> with
// an explicit width attribute and inline styles.
function renderEmailImage(doc: Media, altOverride?: string): string {
  if (!doc.url || !doc.mimeType?.startsWith("image")) return "";
  // Prefer the uncropped 1200px rendition; older uploads (and images
  // already narrower than that) only have the original.
  const email = doc.sizes?.email;
  const src = email?.url ? email : doc;
  const width = Math.min(src.width ?? CONTENT_WIDTH, CONTENT_WIDTH);
  return `<img src="${escapeHTML(absoluteMediaUrl(src.url!))}" alt="${escapeHTML(altOverride || doc.alt || "")}" width="${width}" style="display:block;width:100%;max-width:${width}px;height:auto;margin:24px auto;border:0;border-radius:8px;" />`;
}

// Same visual shell as the welcome email: cream page, white card, serif.
export function renderNewsletterHtml(
  body: SerializedEditorState,
  {
    forTest,
    media = new Map(),
  }: { forTest: boolean; media?: Map<string, Media> },
): string {
  // Fail the send rather than mail a newsletter with a hole in it. Checked
  // up front because the converter swallows errors thrown inside it.
  if (collectUploadIds(body).some((id) => !media.has(String(id)))) {
    throw new Error(
      "A picture in the newsletter no longer exists in Media. Remove it from the body or upload it again.",
    );
  }

  let inner = convertLexicalToHTML({
    data: body,
    disableContainer: true,
    converters: ({ defaultConverters }) => ({
      ...defaultConverters,
      // Body data inside a save hook holds bare media IDs, which the
      // default converter silently drops — look them up instead.
      upload: ({ node }) => {
        const value = node.value as unknown;
        const doc =
          value && typeof value === "object"
            ? (value as Media)
            : media.get(String(value));
        const alt = (node.fields as { alt?: string } | undefined)?.alt;
        return doc ? renderEmailImage(doc, alt) : "";
      },
    }),
  });
  inner = inner
    // Email clients ignore stylesheets — style tags inline.
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
