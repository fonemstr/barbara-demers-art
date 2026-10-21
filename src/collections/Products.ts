import type { CollectionConfig } from "payload";

// The Budderlee Village Store: cards (and later shirts) sold from
// /budderlee/shop. Kept apart from Paintings so merchandise never mixes
// with the gallery. Each product has one or more options (a single card,
// a pack of ten, a shirt size), each with its own price and stock.
async function revalidateShopPaths(slugs: (string | undefined)[]) {
  try {
    const { revalidatePath } = await import("next/cache");
    // The whole shop: the list, every product page and the basket.
    revalidatePath("/budderlee/shop", "layout");
    for (const slug of slugs) {
      if (slug) revalidatePath(`/budderlee/shop/${slug}`);
    }
  } catch {
    // outside a request context (scripts, migrations): nothing to do
  }
}

export function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const Products: CollectionConfig = {
  slug: "products",
  labels: {
    singular: "Product",
    plural: "Products",
  },
  admin: {
    useAsTitle: "name",
    group: "Village Store",
    defaultColumns: ["name", "category", "status", "updatedAt"],
    description:
      "Cards and other goods sold in the Budderlee Village Store (/budderlee/shop). Paintings and prints stay in Paintings.",
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        // A slug is the product's web address: keep it lowercase, with
        // dashes, and no stray spaces, which would break the link.
        if (data && typeof data.slug === "string") data.slug = toSlug(data.slug);
        return data;
      },
    ],
    afterChange: [
      async ({ doc, previousDoc }) => {
        await revalidateShopPaths([doc?.slug, previousDoc?.slug]);
        return doc;
      },
    ],
    afterDelete: [
      async ({ doc }) => {
        await revalidateShopPaths([doc?.slug]);
        return doc;
      },
    ],
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true;
      return { status: { equals: "published" } };
    },
  },
  fields: [
    {
      name: "name",
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
          "URL-friendly identifier. Lowercase, dashes instead of spaces (e.g. walter-christmas-card).",
      },
    },
    {
      name: "category",
      type: "select",
      required: true,
      defaultValue: "cards",
      options: [
        { label: "Cards", value: "cards" },
        { label: "Apparel", value: "apparel" },
        { label: "Gifts", value: "gifts" },
      ],
    },
    {
      name: "images",
      type: "array",
      minRows: 1,
      admin: {
        description:
          "The first photo is the one shown in the shop. Add the inside of the card or the envelope as extra photos.",
      },
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
      name: "description",
      type: "textarea",
      admin: {
        description: "What it is: size, paper, what's written inside, envelopes included.",
      },
    },
    {
      name: "resident",
      type: "relationship",
      relationTo: "paintings",
      filterOptions: { collection: { equals: "budderlee" } },
      admin: {
        description: "Optional. The resident pictured, named on the product page with a link to them.",
      },
    },
    {
      name: "variants",
      label: "Options",
      type: "array",
      minRows: 1,
      required: true,
      labels: { singular: "Option", plural: "Options" },
      admin: {
        description:
          "What a buyer can choose, each with its own price, e.g. \"Single card\" and \"Pack of 10\". A product with one option shows no choice.",
      },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "label",
              type: "text",
              required: true,
              admin: { width: "50%" },
            },
            {
              name: "price",
              type: "number",
              required: true,
              min: 0,
              label: "Price ($)",
              admin: { width: "25%", step: 0.01, description: "In dollars, e.g. 6 or 4.50" },
            },
            {
              name: "stock",
              type: "number",
              min: 0,
              admin: {
                width: "25%",
                description: "How many are on hand. Leave empty for no limit. Goes down by itself with each sale.",
              },
            },
          ],
        },
      ],
    },
    {
      name: "seasonal",
      type: "text",
      admin: {
        position: "sidebar",
        description: "Optional note on the shop card, e.g. \"Order by December 12 for Christmas\".",
      },
    },
    {
      name: "sortOrder",
      type: "number",
      defaultValue: 0,
      admin: {
        position: "sidebar",
        description: "Lower numbers come first in the shop.",
      },
    },
    {
      name: "status",
      type: "select",
      defaultValue: "draft",
      required: true,
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
      admin: {
        position: "sidebar",
        description: "Only published products are in the shop. Set back to Draft to put something away after the season.",
      },
    },
  ],
};
