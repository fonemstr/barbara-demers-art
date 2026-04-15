import type { CollectionConfig } from "payload";

export const Paintings: CollectionConfig = {
  slug: "paintings",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "priceCents", "sold", "sizeTier", "updatedAt"],
    description: "Original paintings for sale in the gallery.",
  },
  access: {
    read: () => true,
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
        description: "The animal or main subject — e.g. Red fox",
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
