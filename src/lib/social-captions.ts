import { SITE_URL } from "@/lib/site-url";
import { formatPrice } from "@/lib/utils";

// Caption templates for auto-announced paintings. Kept under X's 280-char
// limit so one caption works everywhere.

type AnnounceablePainting = {
  title: string;
  slug: string;
  medium?: string | null;
  widthIn?: number | null;
  heightIn?: number | null;
  priceCents?: number | null;
  collection?: string | null;
  characterName?: string | null;
  characterRole?: string | null;
};

const MAX_LENGTH = 275;

function clamp(text: string): string {
  return text.length <= MAX_LENGTH ? text : `${text.slice(0, MAX_LENGTH - 1)}…`;
}

export function buildAnnouncementCaption(p: AnnounceablePainting): string {
  const price =
    p.priceCents != null ? ` · ${formatPrice(p.priceCents)}` : "";

  if (p.collection === "meadowbrook" && p.characterName) {
    const role = p.characterRole ? `, ${p.characterRole}` : "";
    return clamp(
      [
        `A new resident has arrived in Budderlee 🏡`,
        `Meet ${p.characterName}${role} — an original 5×5 inch painting${price}.`,
        `See the whole village: ${SITE_URL}/budderlee`,
      ].join("\n"),
    );
  }

  const size =
    p.widthIn && p.heightIn ? `, ${p.widthIn}×${p.heightIn} in` : "";
  return clamp(
    [
      `New painting from the studio: “${p.title}”`,
      `${p.medium ?? "Original painting"}${size}${price}.`,
      `${SITE_URL}/gallery/${p.slug}`,
    ].join("\n"),
  );
}
