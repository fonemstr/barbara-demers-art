import type { CollectionConfig, Payload } from "payload";
import { sendSocialPost, type SocialPlatform } from "../lib/ayrshare";
import { buildAnnouncementCaption } from "../lib/social-captions";
import { SITE_URL } from "../lib/site-url";

// Lazy-imported so `payload` CLI runs (migrations, etc.) don't pull in
// Next's runtime.
async function revalidatePaintingPaths(slugs: (string | undefined)[]) {
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/");
  revalidatePath("/gallery");
  for (const slug of slugs) {
    if (slug) revalidatePath(`/gallery/${slug}`);
  }
}

type PaintingDoc = {
  title: string;
  slug: string;
  medium?: string | null;
  widthIn?: number | null;
  heightIn?: number | null;
  priceCents?: number | null;
  collection?: string | null;
  characterName?: string | null;
  characterRole?: string | null;
  announceOnSocial?: boolean | null;
  images?: Array<{ image?: number | { url?: string | null } | null }> | null;
};

// Fires when "Announce on social" flips from off to on. The announcement
// is recorded in Social Posts so there's a visible delivery report, and a
// failure never blocks saving the painting itself.
// In afterChange hooks the image relation usually arrives as a bare ID,
// not a populated object — fetch the media doc in that case.
async function resolveFirstImageUrl(
  payload: Payload,
  doc: PaintingDoc,
): Promise<string | null> {
  const firstImage = doc.images?.[0]?.image;
  if (firstImage == null) return null;
  if (typeof firstImage === "object") return firstImage.url ?? null;
  try {
    const media = await payload.findByID({
      collection: "media",
      id: firstImage,
      depth: 0,
    });
    return (media as { url?: string | null }).url ?? null;
  } catch (err) {
    payload.logger.error(
      `[social] could not load media ${firstImage} for "${doc.slug}": ${err}`,
    );
    return null;
  }
}

async function announcePainting(payload: Payload, doc: PaintingDoc) {
  const imageUrl = await resolveFirstImageUrl(payload, doc);

  const caption = buildAnnouncementCaption(doc);
  // Instagram and Pinterest reject posts without media, so they only join
  // when an image resolved; Facebook posts either way.
  const platforms: SocialPlatform[] = imageUrl
    ? ["instagram", "facebook", "pinterest"]
    : ["facebook"];
  const result = await sendSocialPost({
    post: caption,
    platforms: [...platforms],
    mediaUrls: imageUrl ? [imageUrl] : [],
    pinterestOptions: {
      link: `${SITE_URL}/gallery/${doc.slug}`,
      title: doc.title.slice(0, 100),
    },
  });

  await payload
    .create({
      collection: "social-posts",
      data: {
        title: `Auto-announce: ${doc.title}`,
        message: caption,
        platforms: [...platforms],
        status: result.ok ? "posted" : "failed",
        result: result.summary,
      },
      overrideAccess: true,
    })
    .catch((err) =>
      payload.logger.error(`[social] failed to record announcement: ${err}`),
    );

  if (!result.ok) {
    payload.logger.error(
      `[social] auto-announce failed for "${doc.slug}": ${result.summary}`,
    );
  }
}

export const Paintings: CollectionConfig = {
  slug: "paintings",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "subjectGroup", "priceCents", "sold", "sizeTier", "updatedAt"],
    description: "Original paintings for sale in the gallery.",
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, req }) => {
        // Include the previous slug in case the editor renamed it, so the
        // old URL stops serving stale HTML.
        await revalidatePaintingPaths([doc?.slug, previousDoc?.slug]);

        // Announce exactly once, on the off→on transition of the checkbox.
        if (doc?.announceOnSocial && !previousDoc?.announceOnSocial) {
          await announcePainting(req.payload, doc as PaintingDoc);
        }
        return doc;
      },
    ],
    afterDelete: [
      async ({ doc }) => {
        await revalidatePaintingPaths([doc?.slug]);
        return doc;
      },
    ],
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: {
        description:
          "URL-friendly identifier. Lowercase, dashes instead of spaces (e.g. red-fox-in-winter).",
      },
    },
    {
      name: "subject",
      type: "text",
      admin: {
        description: "The specific animal or main subject — e.g. Red fox",
      },
    },
    {
      // NEW — enables gallery filtering by species group.
      // Values are deliberately broad so the filter stays useful as the
      // catalogue grows. Add/rename later via this enum (existing rows
      // keep their old value; migrate them in admin when needed).
      name: "subjectGroup",
      label: "Subject group",
      type: "select",
      defaultValue: "other",
      options: [
        { label: "Dog", value: "dog" },
        { label: "Cat", value: "cat" },
        { label: "Pasture — Horses", value: "horse" },
        { label: "Pasture — Farm animals (cow, pig, sheep, goat, chicken…)", value: "farm" },
        { label: "The Wild — Land animals (fox, otter, deer, hare, bear…)", value: "wild" },
        { label: "The Wild — Birds (raptor, songbird, waterfowl)", value: "bird" },
        { label: "Small Wonders — Insects, flowers, and other small lives", value: "other" },
      ],
      admin: {
        description:
          "Used for gallery filters and homepage collection blocks. Pasture = farm + horse; The Wild = wild + bird; Small Wonders = other.",
      },
    },
    {
      // Named, curated series — different axis from subjectGroup. A
      // Budderlee painting still appears in the main gallery; it also
      // appears on the collection's own landing page. The stored value
      // remains "meadowbrook" (legacy DB enum) — user-facing name is
      // Budderlee.
      name: "collection",
      type: "select",
      defaultValue: "none",
      options: [
        { label: "None — standalone painting", value: "none" },
        { label: "The Residents of Budderlee", value: "meadowbrook" },
      ],
      admin: {
        description:
          "Part of a named series? Budderlee paintings get their own page at /budderlee with character name and role.",
      },
    },
    {
      type: "row",
      admin: {
        condition: (data) => data?.collection === "meadowbrook",
      },
      fields: [
        {
          name: "characterName",
          label: "Character name",
          type: "text",
          admin: {
            description: "e.g. Maisie",
          },
        },
        {
          name: "characterRole",
          label: "Role in the village",
          type: "text",
          admin: {
            description: "e.g. The Pie Maker",
          },
        },
      ],
    },
    {
      name: "year",
      type: "number",
      required: true,
      min: 1900,
      max: 2100,
    },
    {
      name: "medium",
      type: "text",
      required: true,
      defaultValue: "Oil on canvas",
    },
    {
      type: "row",
      fields: [
        {
          name: "widthIn",
          type: "number",
          label: "Width (in)",
          required: true,
          min: 1,
        },
        {
          name: "heightIn",
          type: "number",
          label: "Height (in)",
          required: true,
          min: 1,
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "priceCents",
          type: "number",
          label: "Price (cents)",
          required: true,
          min: 0,
          admin: {
            description: "Price in cents. $1,450 = 145000",
          },
        },
        {
          name: "sizeTier",
          type: "select",
          required: true,
          defaultValue: "medium",
          options: [
            { label: "Free shipping", value: "free" },
            { label: "Small — up to 12×16 in", value: "small" },
            { label: "Medium — up to 20×24 in", value: "medium" },
            { label: "Large — up to 30×40 in", value: "large" },
            { label: "Oversize — over 30×40 in", value: "oversize" },
          ],
          admin: {
            description: "Determines the shipping rate charged at checkout",
          },
        },
      ],
    },
    {
      name: "description",
      type: "textarea",
      required: true,
      admin: {
        description:
          "Short gallery/card description. Keep this concise; use the story field below for the longer piece-specific narrative.",
      },
    },
    {
      name: "storyBehindPainting",
      label: "The story behind the painting",
      type: "textarea",
      admin: {
        description:
          "Optional longer story shown on the artwork detail page. Leave blank to use the default Barbara/expressive-realism copy.",
        rows: 7,
      },
    },
    {
      name: "printOptions",
      label: "Print options",
      type: "array",
      labels: { singular: "Print size", plural: "Print sizes" },
      admin: {
        description:
          "Giclée print sizes offered for this painting. Leave empty if prints are not (yet) available. Prints stay purchasable after the original sells.",
      },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "widthIn",
              type: "number",
              label: "Width (in)",
              required: true,
              min: 1,
            },
            {
              name: "heightIn",
              type: "number",
              label: "Height (in)",
              required: true,
              min: 1,
            },
            {
              name: "priceCents",
              type: "number",
              label: "Price (cents)",
              required: true,
              min: 0,
              admin: {
                description: "$75 = 7500",
              },
            },
          ],
        },
      ],
    },
    {
      name: "images",
      type: "array",
      minRows: 1,
      required: true,
      labels: { singular: "Image", plural: "Images" },
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          required: true,
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "featured",
          type: "checkbox",
          defaultValue: false,
          admin: {
            description: "Show on the home page",
          },
        },
        {
          name: "sold",
          type: "checkbox",
          defaultValue: false,
          admin: {
            description: "Hide the Buy button and show a sold badge",
          },
        },
        {
          name: "announceOnSocial",
          label: "Announce on social",
          type: "checkbox",
          defaultValue: false,
          admin: {
            description:
              "Tick and save to post this painting to Instagram + Facebook (via Ayrshare). Posts once, when first ticked; the delivery report appears under Social Posts. Untick and re-tick to announce again.",
          },
        },
      ],
    },
  ],
};
