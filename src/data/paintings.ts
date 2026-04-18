import { getPayloadClient } from "@/lib/payload";
import {
  SUBJECT_GROUPS,
  SUBJECT_GROUP_LABELS,
  type SubjectGroup,
} from "@/data/subject-groups";

export { SUBJECT_GROUPS, SUBJECT_GROUP_LABELS };
export type { SubjectGroup };

export type SizeTier = "small" | "medium" | "large" | "oversize";

export type Painting = {
  slug: string;
  title: string;
  subject: string;
  subjectGroup: SubjectGroup;
  year: number;
  medium: string;
  widthIn: number;
  heightIn: number;
  priceCents: number;
  sizeTier: SizeTier;
  description: string;
  images: string[];
  sold?: boolean;
  featured?: boolean;
};

export const SHIPPING_RATES: Record<
  SizeTier,
  { label: string; cents: number }
> = {
  small: { label: "Small — up to 12×16 in", cents: 2500 },
  medium: { label: "Medium — up to 20×24 in", cents: 4500 },
  large: { label: "Large — up to 30×40 in", cents: 8500 },
  oversize: { label: "Oversize — over 30×40 in", cents: 15000 },
};

const seedPaintings: Painting[] = [
  {
    slug: "river-otter-study",
    title: "River Otter, Morning Light",
    subject: "River otter",
    subjectGroup: "wild",
    year: 2026,
    medium: "Oil on linen",
    widthIn: 16,
    heightIn: 20,
    priceCents: 85000,
    sizeTier: "medium",
    featured: true,
    description:
      "Study of a river otter caught in early morning light on the shoreline. Built up in thin glazes over a warm underpainting, with the wet fur worked wet-into-wet.",
    images: ["/paintings/placeholder-1.svg"],
  },
  {
    slug: "red-fox-in-winter",
    title: "Red Fox in Winter",
    subject: "Red fox",
    subjectGroup: "wild",
    year: 2026,
    medium: "Oil on canvas",
    widthIn: 24,
    heightIn: 30,
    priceCents: 145000,
    sizeTier: "large",
    featured: true,
    description:
      "A red fox pausing in fresh snow. Bold brushwork in the tail balances the softer handling of the snowbanks behind.",
    images: ["/paintings/placeholder-2.svg"],
  },
  {
    slug: "barn-owl-portrait",
    title: "Barn Owl Portrait",
    subject: "Barn owl",
    subjectGroup: "bird",
    year: 2025,
    medium: "Oil on panel",
    widthIn: 12,
    heightIn: 12,
    priceCents: 52000,
    sizeTier: "small",
    featured: true,
    description:
      "Close study of a barn owl's face. Careful value work through the feathers, with the eyes kept as the focal point.",
    images: ["/paintings/placeholder-3.svg"],
  },
  {
    slug: "horse-at-pasture",
    title: "Horse at Pasture",
    subject: "Horse",
    subjectGroup: "horse",
    year: 2025,
    medium: "Oil on canvas",
    widthIn: 20,
    heightIn: 24,
    priceCents: 110000,
    sizeTier: "medium",
    description:
      "A bay gelding grazing in late afternoon. Loose atmospheric handling in the background pasture, tighter drawing in the figure.",
    images: ["/paintings/placeholder-4.svg"],
    sold: true,
  },
];

type PayloadPainting = {
  slug: string;
  title: string;
  subject?: string;
  subjectGroup?: SubjectGroup;
  year: number;
  medium: string;
  widthIn: number;
  heightIn: number;
  priceCents: number;
  sizeTier: SizeTier;
  description: string;
  images?: Array<{ image: { url?: string } | string }>;
  sold?: boolean;
  featured?: boolean;
};

function mapPayloadPainting(p: PayloadPainting): Painting {
  const images = (p.images ?? [])
    .map((entry) => {
      const img = entry.image;
      if (!img || typeof img === "string") return null;
      return img.url ?? null;
    })
    .filter((url): url is string => !!url);

  return {
    slug: p.slug,
    title: p.title,
    subject: p.subject ?? "",
    // Default to "other" if the field is missing (e.g. rows created before
    // this field was added). Admin users can reclassify in Payload.
    subjectGroup: p.subjectGroup ?? "other",
    year: p.year,
    medium: p.medium,
    widthIn: p.widthIn,
    heightIn: p.heightIn,
    priceCents: p.priceCents,
    sizeTier: p.sizeTier,
    description: p.description,
    images: images.length ? images : ["/paintings/placeholder-1.svg"],
    sold: p.sold ?? false,
    featured: p.featured ?? false,
  };
}

export async function getAllPaintings(): Promise<Painting[]> {
  const payload = await getPayloadClient();
  if (!payload) return seedPaintings;

  try {
    const result = await payload.find({
      collection: "paintings",
      depth: 2,
      limit: 200,
      sort: "-updatedAt",
    });
    return (result.docs as unknown as PayloadPainting[]).map(mapPayloadPainting);
  } catch (err) {
    console.error("[paintings] Payload query failed, using seed:", err);
    return seedPaintings;
  }
}

export async function getPainting(slug: string): Promise<Painting | undefined> {
  const payload = await getPayloadClient();
  if (!payload) return seedPaintings.find((p) => p.slug === slug);

  try {
    const result = await payload.find({
      collection: "paintings",
      depth: 2,
      limit: 1,
      where: { slug: { equals: slug } },
    });
    const doc = result.docs[0] as unknown as PayloadPainting | undefined;
    return doc ? mapPayloadPainting(doc) : undefined;
  } catch (err) {
    console.error("[paintings] Payload query failed, using seed:", err);
    return seedPaintings.find((p) => p.slug === slug);
  }
}

export async function getFeaturedPaintings(limit = 3): Promise<Painting[]> {
  const all = await getAllPaintings();
  return all.filter((p) => p.featured && !p.sold).slice(0, limit);
}

export async function getAvailablePaintings(): Promise<Painting[]> {
  const all = await getAllPaintings();
  return all.filter((p) => !p.sold);
}

/**
 * NEW — filter gallery by subject group. Pass `undefined` or "all" for
 * the full set. Used by the gallery chip filter in PR 3.
 */
export async function getPaintingsByGroup(
  group?: SubjectGroup | "all"
): Promise<Painting[]> {
  const all = await getAllPaintings();
  if (!group || group === "all") return all;
  return all.filter((p) => p.subjectGroup === group);
}

/**
 * NEW — which subject groups currently have paintings? Drives the
 * gallery chip list (hide empty chips).
 */
export async function getAvailableSubjectGroups(): Promise<SubjectGroup[]> {
  const all = await getAllPaintings();
  const present = new Set(all.map((p) => p.subjectGroup));
  return SUBJECT_GROUPS.filter((g) => present.has(g));
}
