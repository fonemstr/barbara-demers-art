import { getPayloadClient } from "./payload";

// The Budderlee Page global: content for /budderlee not tied to a painting,
// tale or subscription setting.

export type BudderleePageSettings = {
  originalsPhoto?: { url: string; width?: number; height?: number; alt?: string };
  originalsIncludes?: string;
};

export async function getBudderleePageSettings(): Promise<BudderleePageSettings> {
  const payload = await getPayloadClient();
  if (!payload) return {};
  try {
    const g = await payload.findGlobal({ slug: "budderlee-page", depth: 1 });
    const photo = g.originalsPhoto && typeof g.originalsPhoto === "object" ? g.originalsPhoto : undefined;
    return {
      originalsPhoto: photo?.url
        ? {
            url: photo.url,
            width: photo.width ?? undefined,
            height: photo.height ?? undefined,
            alt: photo.alt ?? undefined,
          }
        : undefined,
      originalsIncludes: g.originalsIncludes?.trim() || undefined,
    };
  } catch (err) {
    console.error("[budderlee-page] settings unavailable:", err);
    return {};
  }
}

/** Shown until Barbara writes her own "What an original includes". */
export const DEFAULT_ORIGINALS_INCLUDES =
  "Each original arrives framed and thoughtfully packaged with keepsakes from the village.";
