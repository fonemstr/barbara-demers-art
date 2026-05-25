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
    defaultColumns: [
      "title",
      "availabilityStatus",
      "subjectGroup",
      "priceCents",
      "sizeTier",
      "updatedAt",
    ],
    description:
      "Original paintings shown on Available Work and individual artwork pages.",
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
      type: "tabs",
      tabs: [
        {
          label: "Artwork",
          fields: [
            {
              name: "title",
              type: "text",
              required: true,
              admin: {
                description:
                  "The exact painting title. Barbara's titles carry the emotional meaning of the work.",
              },
            },
            {
              name: "slug",
              type: "text",
              required: true,
              unique: true,
              admin: {
                description:
                  "URL-friendly identifier. Lowercase, dashes instead of spaces (e.g. you-are-not-a-number-you-are-love).",
              },
            },
            {
              name: "subject",
              type: "text",
              admin: {
                description: "The specific animal, insect, or main subject — e.g. Bull, Chimpanzee, Honeybee.",
              },
            },
            {
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
                { label: "Other / insect / nature", value: "other" },
              ],
              admin: {
                description: "Used to filter Available Work by subject group.",
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
              defaultValue: "Acrylic on canvas",
              admin: {
                description:
                  "Use the actual medium for this piece, e.g. Acrylic on canvas, Oil on panel. Avoid making the whole site sound oil-first.",
              },
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
          ],
        },
        {
          label: "Story",
          fields: [
            {
              name: "description",
              label: "Short description / card teaser",
              type: "textarea",
              required: true,
              admin: {
                description:
                  "One or two sentences shown on artwork cards and used as fallback SEO text.",
              },
            },
            {
              name: "storyTeaser",
              label: "One-line story hook",
              type: "text",
              admin: {
                description:
                  "Optional short hook for cards/social-style previews, e.g. 'A bull seen beyond the tag, beyond the number.'",
              },
            },
            {
              name: "story",
              label: "The story behind the painting",
              type: "textarea",
              admin: {
                rows: 8,
                description:
                  "The narrative shown on the individual artwork page: why it was created, what the title means, and what details viewers should notice.",
              },
            },
          ],
        },
        {
          label: "Images",
          fields: [
            {
              name: "images",
              type: "array",
              minRows: 1,
              required: true,
              labels: { singular: "Image", plural: "Images" },
              admin: {
                description:
                  "Put the main full-painting image first. Add detail photos afterward for the 'Look closer' section.",
              },
              fields: [
                {
                  name: "image",
                  type: "upload",
                  relationTo: "media",
                  required: true,
                },
                {
                  name: "role",
                  type: "select",
                  defaultValue: "detail",
                  options: [
                    { label: "Main full painting", value: "main" },
                    { label: "Detail / close-up", value: "detail" },
                    { label: "Scale / room view", value: "scale" },
                    { label: "Signature / edge", value: "signature" },
                  ],
                  admin: {
                    description:
                      "Helps Barbara organize which photos are full artwork views versus detail areas.",
                  },
                },
                {
                  name: "caption",
                  type: "text",
                  admin: {
                    description:
                      "Optional caption for detail photos, e.g. 'LOVE replacing the numbered ear tag.'",
                  },
                },
              ],
            },
          ],
        },
        {
          label: "Availability & sales",
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "availabilityStatus",
                  label: "Availability status",
                  type: "select",
                  required: true,
                  defaultValue: "available",
                  options: [
                    { label: "Available", value: "available" },
                    { label: "Reserved", value: "reserved" },
                    { label: "Sold", value: "sold" },
                    { label: "Coming soon", value: "comingSoon" },
                    { label: "In studio / not released", value: "inStudio" },
                  ],
                  admin: {
                    description:
                      "Controls the badge and whether the page shows checkout, inquiry, or release/list language.",
                  },
                },
                {
                  name: "priceDisplay",
                  label: "Price display",
                  type: "select",
                  required: true,
                  defaultValue: "visible",
                  options: [
                    { label: "Show price and checkout", value: "visible" },
                    { label: "Show price, inquire to buy", value: "inquire" },
                    { label: "Hide price / inquire", value: "hidden" },
                  ],
                  admin: {
                    description:
                      "Use 'visible' for direct checkout. Use inquire/hidden for larger or not-yet-released originals.",
                  },
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
                    description: "Price in cents. $1,450 = 145000. Still required even if price is hidden.",
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
              name: "availabilityNote",
              type: "text",
              admin: {
                description:
                  "Optional note shown near the CTA, e.g. 'Available after the studio preview on June 12.'",
              },
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
                    description:
                      "Legacy sold flag. Prefer Availability status = Sold for new edits; this remains so older records keep working.",
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
