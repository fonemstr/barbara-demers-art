import type { CollectionConfig, Payload } from "payload";
import type { SocialPlatform } from "../lib/social-direct";
import { deliverSocialPost } from "../lib/social-delivery";
import { buildAnnouncementCaption } from "../lib/social-captions";
import { SITE_URL } from "../lib/site-url";
import { STAR_SIGNS, starSignForDate } from "../lib/zodiac";

// Lazy-imported so `payload` CLI runs (migrations, etc.) don't pull in
// Next's runtime.
async function revalidatePaintingPaths(slugs: (string | undefined)[]) {
  // Revalidation only works inside a Next request; scripts and CLI runs
  // must still be able to save, so never let it fail the write.
  try {
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/");
    revalidatePath("/gallery");
    revalidatePath("/budderlee");
    for (const slug of slugs) {
      if (slug) revalidatePath(`/gallery/${slug}`);
    }
  } catch {
    // outside a request context (scripts, migrations) — nothing to do
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
  const pinterestOptions = {
    link: `${SITE_URL}/gallery/${doc.slug}`,
    title: doc.title.slice(0, 100),
  };

  // Instagram and Pinterest reject posts without media; Facebook still posts.
  // With an image, the shared delivery path pads tall or wide artwork for
  // Instagram while Facebook and Pinterest keep the original proportions.
  const wanted: SocialPlatform[] = imageUrl
    ? ["instagram", "facebook", "pinterest"]
    : ["facebook"];
  const result = await deliverSocialPost({
    post: caption,
    platforms: wanted,
    imageUrl,
    imageSlug: doc.slug,
    logger: payload.logger,
    pinterestOptions,
  });
  const platforms = result.platforms;

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
    beforeValidate: [
      // Slugs are URLs: keep them lowercase and clean so case variants never
      // 404 or split Google's index. Titles lose stray whitespace.
      ({ data }) => {
        if (!data) return data;
        if (typeof data.slug === "string") {
          data.slug = data.slug
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
        }
        if (typeof data.title === "string") data.title = data.title.trim();
        if (typeof data.subject === "string") data.subject = data.subject.trim();
        // The star sign follows the birthday unless Barbara picks one.
        const profile = data.profile as
          | { dateOfBirth?: string | null; starSign?: string | null }
          | undefined;
        if (profile && typeof profile.dateOfBirth === "string" && !profile.starSign) {
          profile.starSign = starSignForDate(profile.dateOfBirth) ?? null;
        }
        return data;
      },
    ],
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
        {
          label: "None — collection painting (e.g. a Budderlee resident)",
          value: "none",
        },
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
          "Used for gallery filters and homepage collection blocks. Pasture = farm + horse; The Wild = wild + bird; Small Wonders = other. Pick None for collection paintings (like Budderlee residents) — they appear in the gallery under All, without a species filter.",
      },
    },
    {
      // Named, curated series — different axis from subjectGroup. A
      // Budderlee painting still appears in the main gallery; it also
      // appears on the collection's own landing page.
      name: "collection",
      type: "select",
      defaultValue: "none",
      options: [
        { label: "None — standalone painting", value: "none" },
        { label: "The Residents of Budderlee", value: "budderlee" },
      ],
      admin: {
        description:
          "Part of a named series? Budderlee paintings get their own page at /budderlee with character name and role.",
      },
    },
    {
      type: "row",
      admin: {
        condition: (data) => data?.collection === "budderlee",
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
      // The profile printed on the back of each Budderlee Post card.
      type: "group",
      name: "profile",
      label: "Resident profile (back of the card)",
      admin: {
        condition: (data) => data?.collection === "budderlee",
        description:
          "What The Budderlee Post prints on the back of the 5×7 card. The star sign fills itself in from the birthday when left blank.",
      },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "residentNumber",
              label: "Resident number",
              type: "number",
              min: 1,
              admin: { description: "Walter is 1. Printed as No. 001.", width: "25%" },
            },
            {
              name: "dateOfBirth",
              label: "Birthday",
              type: "date",
              admin: {
                date: { pickerAppearance: "dayOnly" },
                description: "The year is optional flavor; only month and day print.",
                width: "35%",
              },
            },
            {
              name: "starSign",
              label: "Star sign",
              type: "select",
              options: STAR_SIGNS.map((s) => ({ label: `${s.symbol} ${s.label}`, value: s.value })),
              admin: { description: "Auto-filled from the birthday. Change it if the character disagrees.", width: "40%" },
            },
          ],
        },
        {
          name: "friends",
          type: "relationship",
          relationTo: "paintings",
          hasMany: true,
          filterOptions: ({ id }) => ({
            collection: { equals: "budderlee" },
            ...(id ? { id: { not_equals: id } } : {}),
          }),
          admin: { description: "Other residents. Their names print on the card." },
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
              "Tick and save to post this painting to Instagram + Facebook (via the platform APIs). Posts once, when first ticked; the delivery report appears under Social Posts. Untick and re-tick to announce again.",
          },
        },
      ],
    },
  ],
};
