import { getPayloadClient } from "@/lib/payload";
import {
  SUBJECT_GROUPS,
  SUBJECT_GROUP_LABELS,
  type SubjectGroup,
} from "@/data/subject-groups";

export { SUBJECT_GROUPS, SUBJECT_GROUP_LABELS };
export type { SubjectGroup };

export type SizeTier = "free" | "small" | "medium" | "large" | "oversize";

export type PaintingCollection = "none" | "budderlee";

export type PrintOption = {
  id: string;
  widthIn: number;
  heightIn: number;
  priceCents: number;
};

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
  storyBehindPainting?: string;
  images: string[];
  prints?: PrintOption[];
  collection?: PaintingCollection;
  characterName?: string;
  characterRole?: string;
  sold?: boolean;
  featured?: boolean;
};

export const DEFAULT_PAINTING_STORY =
  "The title is part of the work. Barbara uses narrative titles, bold color, and symbolic detail to invite a slower look — not just at the subject's likeness, but at the feeling and life held inside the painting.";

export const SHIPPING_RATES: Record<
  SizeTier,
  { label: string; cents: number }
> = {
  free: { label: "Free shipping", cents: 0 },
  small: { label: "Small — up to 12×16 in", cents: 2500 },
  medium: { label: "Medium — up to 20×24 in", cents: 4500 },
  large: { label: "Large — up to 30×40 in", cents: 8500 },
  oversize: { label: "Oversize — over 30×40 in", cents: 15000 },
};

// Prints ship flat or rolled in a tube regardless of size, so a single
// flat rate covers the whole order.
export const PRINT_SHIPPING_RATE = {
  label: "Print shipping — flat rate",
  cents: 1200,
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
    storyBehindPainting:
      "In this painting, the ear tag becomes a place of transformation. What could have been a number becomes LOVE — a small symbolic shift that asks the viewer to meet the bull as an individual life, not an anonymous body.",
    images: ["/paintings/placeholder-1.svg"],
    prints: [
      { id: "8x10", widthIn: 8, heightIn: 10, priceCents: 4500 },
      { id: "12x16", widthIn: 12, heightIn: 16, priceCents: 7500 },
      { id: "18x24", widthIn: 18, heightIn: 24, priceCents: 12500 },
    ],
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
    // The original found a home, but prints keep it available — this is
    // the core of the supplemental-income model.
    prints: [
      { id: "8x10", widthIn: 8, heightIn: 10, priceCents: 4500 },
      { id: "12x16", widthIn: 12, heightIn: 16, priceCents: 7500 },
    ],
  },
  // Sample Budderlee residents so the /budderlee page has content in
  // dev without a database. Real residents are added via /admin.
  {
    slug: "maisie-the-pie-maker",
    title: "Maisie, The Pie Maker",
    subject: "Mouse",
    subjectGroup: "other",
    collection: "budderlee",
    characterName: "Maisie",
    characterRole: "The Pie Maker",
    year: 2026,
    medium: "Acrylic on panel",
    widthIn: 5,
    heightIn: 5,
    priceCents: 9500,
    sizeTier: "small",
    description:
      "Maisie carries a tray of fresh pies through the village square. Nobody in Budderlee has ever refused a slice, and nobody ever will.",
    images: ["/paintings/placeholder-2.svg"],
    prints: [{ id: "5x5", widthIn: 5, heightIn: 5, priceCents: 3500 }],
  },
  {
    slug: "reggie-the-night-watchman",
    title: "Reggie, The Night Watchman",
    subject: "Raccoon",
    subjectGroup: "wild",
    collection: "budderlee",
    characterName: "Reggie",
    characterRole: "The Night Watchman",
    year: 2026,
    medium: "Acrylic on panel",
    widthIn: 5,
    heightIn: 5,
    priceCents: 12500,
    sizeTier: "small",
    description:
      "Lantern in paw, Reggie makes his rounds while Budderlee sleeps. He has never once missed a night, or a midnight snack.",
    images: ["/paintings/placeholder-3.svg"],
    sold: true,
    prints: [{ id: "5x5", widthIn: 5, heightIn: 5, priceCents: 3500 }],
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
  storyBehindPainting?: string | null;
  images?: Array<{ image: { url?: string } | string }>;
  printOptions?: Array<{
    id?: string | null;
    widthIn: number;
    heightIn: number;
    priceCents: number;
  }> | null;
  collection?: PaintingCollection | null;
  characterName?: string | null;
  characterRole?: string | null;
  sold?: boolean;
  featured?: boolean;
};

function normalizeOptionalText(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

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
    storyBehindPainting: normalizeOptionalText(p.storyBehindPainting),
    images: images.length ? images : ["/paintings/placeholder-1.svg"],
    prints: (p.printOptions ?? []).map((opt) => ({
      // Payload array rows always carry an id; the dimension fallback keeps
      // checkout working if a row ever arrives without one.
      id: opt.id ?? `${opt.widthIn}x${opt.heightIn}`,
      widthIn: opt.widthIn,
      heightIn: opt.heightIn,
      priceCents: opt.priceCents,
    })),
    collection: p.collection ?? "none",
    characterName: normalizeOptionalText(p.characterName),
    characterRole: normalizeOptionalText(p.characterRole),
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
 * Residents of Budderlee — the 5×5 character portrait series. Sold
 * residents stay listed (prints keep them purchasable), so the village
 * only ever grows.
 */
export async function getBudderleePaintings(): Promise<Painting[]> {
  const all = await getAllPaintings();
  return all.filter((p) => p.collection === "budderlee");
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
