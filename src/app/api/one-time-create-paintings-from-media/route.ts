import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

export const dynamic = "force-dynamic";

type SubjectGroup = "dog" | "cat" | "horse" | "farm" | "wild" | "bird" | "other";
type SizeTier = "small" | "medium" | "large" | "oversize";

type PaintingSeed = {
  mediaId: number;
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
  alt: string;
  featured?: boolean;
  sold?: boolean;
};

const paintings: PaintingSeed[] = [
  {
    mediaId: 2,
    slug: "calico-in-the-trees",
    title: "Calico in the Trees",
    subject: "Calico cat",
    subjectGroup: "cat",
    year: 2026,
    medium: "Acrylic on canvas",
    widthIn: 24,
    heightIn: 36,
    priceCents: 95000,
    sizeTier: "large",
    featured: true,
    description:
      "A calico cat looks out from a green, wooded perch, with bright eyes and layered color drawing attention to her watchful presence.",
    alt: "Expressive realism painting of a calico cat peeking from trees",
  },
  {
    mediaId: 3,
    slug: "bulldog-in-bloom",
    title: "Bulldog in Bloom",
    subject: "Bulldog",
    subjectGroup: "dog",
    year: 2026,
    medium: "Acrylic on canvas",
    widthIn: 20,
    heightIn: 30,
    priceCents: 95000,
    sizeTier: "large",
    featured: true,
    description:
      "A bulldog portrait full of character, surrounded by lively color that gives the pose warmth, humor, and personality.",
    alt: "Colorful expressive realism painting of a bulldog portrait",
  },
  {
    mediaId: 4,
    slug: "holstein-at-the-rail",
    title: "Holstein at the Rail",
    subject: "Holstein cow",
    subjectGroup: "farm",
    year: 2026,
    medium: "Acrylic on canvas",
    widthIn: 40,
    heightIn: 16,
    priceCents: 150000,
    sizeTier: "oversize",
    description:
      "A black-and-white Holstein stands quietly at the rail, rendered with a direct gaze and graphic contrast.",
    alt: "Expressive realism painting of a black and white Holstein cow",
  },
  {
    mediaId: 5,
    slug: "goat-in-spring-light",
    title: "Goat in Spring Light",
    subject: "Goat",
    subjectGroup: "farm",
    year: 2026,
    medium: "Acrylic on canvas",
    widthIn: 18,
    heightIn: 24,
    priceCents: 85000,
    sizeTier: "medium",
    description:
      "A goat stands in pale spring light, its alert profile and soft surroundings giving the portrait a gentle rural stillness.",
    alt: "Expressive realism painting of a goat standing in spring light",
  },
  {
    mediaId: 6,
    slug: "hare-in-the-meadow",
    title: "Hare in the Meadow",
    subject: "Hare",
    subjectGroup: "wild",
    year: 2026,
    medium: "Acrylic on canvas",
    widthIn: 24,
    heightIn: 24,
    priceCents: 95000,
    sizeTier: "large",
    featured: true,
    description:
      "A close hare portrait with luminous ears and a steady eye, set against a soft green meadow background.",
    alt: "Expressive realism painting of a hare with tall ears in a meadow",
  },
  {
    mediaId: 7,
    slug: "sheep-looking-up",
    title: "Sheep, Looking Up",
    subject: "Sheep",
    subjectGroup: "farm",
    year: 2026,
    medium: "Acrylic on canvas",
    widthIn: 24,
    heightIn: 24,
    priceCents: 95000,
    sizeTier: "large",
    description:
      "A sheep lifts its face toward the light, the textured fleece and gentle expression giving the animal a tender individuality.",
    alt: "Expressive realism painting of a sheep looking upward",
  },
  {
    mediaId: 8,
    slug: "barn-door-reflection",
    title: "Barn Door Reflection",
    subject: "Barn door",
    subjectGroup: "other",
    year: 2026,
    medium: "Acrylic on canvas",
    widthIn: 20,
    heightIn: 20,
    priceCents: 65000,
    sizeTier: "medium",
    description:
      "A study of weathered barn boards, water, and reflection, using saturated color to turn a quiet rural detail into a vivid composition.",
    alt: "Expressive acrylic painting of a colorful barn door and reflection",
  },
  {
    mediaId: 9,
    slug: "birch-light",
    title: "Birch Light",
    subject: "Birch trees",
    subjectGroup: "other",
    year: 2026,
    medium: "Acrylic on canvas",
    widthIn: 12,
    heightIn: 30,
    priceCents: 75000,
    sizeTier: "large",
    description:
      "White birch trunks rise through warm gold and orange light, balancing natural detail with bold, expressive color.",
    alt: "Expressive painting of white birch trees against warm golden light",
  },
  {
    mediaId: 10,
    slug: "raven-on-blue",
    title: "Raven on Blue",
    subject: "Raven",
    subjectGroup: "bird",
    year: 2026,
    medium: "Acrylic on canvas",
    widthIn: 20,
    heightIn: 24,
    priceCents: 85000,
    sizeTier: "medium",
    featured: true,
    description:
      "A raven emerges from a weathered surface and deep blue field, its dark feathers built with subtle shifts of light and texture.",
    alt: "Expressive realism painting of a raven against a blue background",
  },
  {
    mediaId: 11,
    slug: "the-kindness-of-one",
    title: "The Kindness of One",
    subject: "Pig",
    subjectGroup: "farm",
    year: 2026,
    medium: "Acrylic on canvas",
    widthIn: 20,
    heightIn: 24,
    priceCents: 85000,
    sizeTier: "medium",
    featured: true,
    description:
      "A pig pauses in a human world as one person reaches out; the small gesture becomes the emotional center of the painting.",
    alt: "Expressive realism painting of a pig being gently touched by a person",
  },
];

export async function POST() {
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.json({ error: "Only available in production." }, { status: 404 });
  }

  const payload = await getPayload({ config });
  const created: string[] = [];
  const skipped: string[] = [];
  const missingMedia: number[] = [];
  const updatedMediaAlt: number[] = [];

  for (const item of paintings) {
    const existing = await payload.find({
      collection: "paintings",
      where: { slug: { equals: item.slug } },
      limit: 1,
      overrideAccess: true,
    });

    if (existing.docs.length) {
      skipped.push(item.slug);
      continue;
    }

    const media = await payload
      .findByID({ collection: "media", id: item.mediaId, overrideAccess: true })
      .catch(() => null);

    if (!media) {
      missingMedia.push(item.mediaId);
      continue;
    }

    if (media.alt !== item.alt) {
      await payload.update({
        collection: "media",
        id: item.mediaId,
        data: { alt: item.alt },
        overrideAccess: true,
      });
      updatedMediaAlt.push(item.mediaId);
    }

    await payload.create({
      collection: "paintings",
      data: {
        title: item.title,
        slug: item.slug,
        subject: item.subject,
        subjectGroup: item.subjectGroup,
        year: item.year,
        medium: item.medium,
        widthIn: item.widthIn,
        heightIn: item.heightIn,
        priceCents: item.priceCents,
        sizeTier: item.sizeTier,
        description: item.description,
        images: [{ image: item.mediaId }],
        featured: item.featured ?? false,
        sold: item.sold ?? false,
      },
      overrideAccess: true,
    });
    created.push(item.slug);
  }

  return NextResponse.json({ ok: true, created, skipped, missingMedia, updatedMediaAlt });
}
