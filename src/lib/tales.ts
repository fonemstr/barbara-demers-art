import { getPayloadClient } from "./payload";
import { cleanResidentName } from "@/data/paintings";

// Tales of Budderlee, read from the Tales collection. Without a database
// (local dev) there are none, and the pages show their empty states.

export type TaleImage = { url: string; width?: number; height?: number; alt?: string };

export type TaleResident = {
  slug: string;
  name: string;
  role?: string;
  image?: TaleImage;
};

export type Tale = {
  slug: string;
  title: string;
  excerpt?: string;
  cover?: TaleImage;
  resident?: TaleResident;
  body?: unknown;
  featured: boolean;
  publishedAt?: string;
};

type MediaDoc = { url?: string | null; width?: number | null; height?: number | null; alt?: string | null };

type TaleDoc = {
  slug: string;
  title: string;
  excerpt?: string | null;
  cover?: number | MediaDoc | null;
  resident?:
    | number
    | {
        slug?: string;
        title?: string;
        characterName?: string | null;
        characterRole?: string | null;
        images?: Array<{ image?: number | MediaDoc | null }> | null;
      }
    | null;
  body?: unknown;
  featured?: boolean | null;
  publishedAt?: string | null;
  createdAt?: string;
};

function image(m: number | MediaDoc | null | undefined): TaleImage | undefined {
  if (!m || typeof m !== "object" || !m.url) return undefined;
  return { url: m.url, width: m.width ?? undefined, height: m.height ?? undefined, alt: m.alt ?? undefined };
}

function mapTale(doc: TaleDoc): Tale {
  const r = doc.resident && typeof doc.resident === "object" ? doc.resident : undefined;
  return {
    slug: doc.slug,
    title: doc.title,
    excerpt: doc.excerpt?.trim() || undefined,
    cover: image(doc.cover),
    resident: r?.slug
      ? {
          slug: r.slug,
          name: cleanResidentName(r.characterName || r.title || r.slug),
          role: r.characterRole?.trim() || undefined,
          image: image(r.images?.[0]?.image),
        }
      : undefined,
    body: doc.body,
    featured: !!doc.featured,
    publishedAt: doc.publishedAt ?? doc.createdAt,
  };
}

/** Published tales, newest first. */
export async function getTales(): Promise<Tale[]> {
  const payload = await getPayloadClient();
  if (!payload) return [];
  try {
    const result = await payload.find({
      collection: "tales",
      depth: 2,
      limit: 200,
      sort: "-publishedAt",
      where: { status: { equals: "published" } },
    });
    return (result.docs as unknown as TaleDoc[]).map(mapTale);
  } catch (err) {
    console.error("[tales] Payload query failed:", err);
    return [];
  }
}

export async function getTale(slug: string): Promise<Tale | undefined> {
  return (await getTales()).find((t) => t.slug === slug);
}

/** The tale ticked "Feature on the Budderlee page", else the newest. */
export async function getFeaturedTale(): Promise<Tale | undefined> {
  const tales = await getTales();
  return tales.find((t) => t.featured) ?? tales[0];
}

export async function getTalesForResident(residentSlug: string): Promise<Tale[]> {
  return (await getTales()).filter((t) => t.resident?.slug === residentSlug);
}
