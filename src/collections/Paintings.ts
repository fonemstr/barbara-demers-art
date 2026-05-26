import type { CollectionConfig } from "payload";

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
      async ({ doc, previousDoc }) => {
        // Include the previous slug in case the editor renamed it, so the
        // old URL stops serving stale HTML.
        await revalidatePaintingPaths([doc?.slug, previousDoc?.slug]);
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
        { label: "Horse", value: "horse" },
        { label: "Farm (cow, pig, sheep, goat, chicken…)", value: "farm" },
        { label: "Wild (fox, otter, deer, hare, bear…)", value: "wild" },
        { label: "Bird (raptor, songbird, waterfowl)", value: "bird" },
        { label: "Other", value: "other" },
      ],
      admin: {
        description: "Used to filter the gallery by species group.",
      },
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
      ],
    },
  ],
};
