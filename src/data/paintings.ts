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
    slug: "you-are-not-a-number-you-are-love",
    title: "You Are Not a Number, You Are Love",
    subject: "Bull",
    subjectGroup: "farm",
    year: 2026,
    medium: "Acrylic on canvas",
    widthIn: 30,
    heightIn: 40,
    priceCents: 85000,
    sizeTier: "large",
    featured: true,
    description:
      "A bull seen beyond the ear tag and beyond the number. The tag's number becomes LOVE, shifting the portrait toward recognition, compassion, and living presence.",
    images: ["/paintings/placeholder-1.svg"],
  },
  {
    slug: "eyes-of-a-different-you",
    title: "Eyes of a Different You",
    subject: "Chimpanzee",
    subjectGroup: "wild",
    year: 2026,
    medium: "Acrylic on canvas",
    widthIn: 24,
    heightIn: 30,
    priceCents: 145000,
    sizeTier: "large",
    featured: true,
    description:
      "A chimpanzee's gaze meets the viewer directly, suggesting both difference and kinship — another life, another way of being, and something familiar looking back.",
    images: ["/paintings/placeholder-2.svg"],
  },
  {
    slug: "the-kindness-of-one",
    title: "The Kindness of One",
    subject: "Pig",
    subjectGroup: "farm",
    year: 2025,
    medium: "Acrylic on canvas",
    widthIn: 20,
    heightIn: 24,
    priceCents: 52000,
    sizeTier: "medium",
    featured: true,
    description:
      "A pig moves through a human world where most pass by. One person reaches out, and that small gesture becomes the emotional center of the painting.",
    images: ["/paintings/placeholder-3.svg"],
  },
  {
    slug: "small-wonder-study",
    title: "Small Wonder Study",
    subject: "Insect",
    subjectGroup: "other",
    year: 2025,
    medium: "Oil on panel",
    widthIn: 20,
    heightIn: 24,
    priceCents: 110000,
    sizeTier: "medium",
    description:
      "A small life enlarged through color and attention — a reminder that wonder is often waiting in the beings easiest to overlook.",
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
