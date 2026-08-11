import type { CollectionConfig } from "payload";

// Portraits already painted and delivered to their owners. They appear on
// the commissions page as examples of past work, each with the owner's
// comment — social proof for people deciding whether to commission.
// Separate from Paintings: these aren't for sale and shouldn't appear in
// the gallery or shop machinery.
export const CommissionedPortraits: CollectionConfig = {
  slug: "commissioned-portraits",
  labels: {
    singular: "Commissioned Portrait",
    plural: "Commissioned Portraits",
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "subject", "ownerName", "year"],
    description:
      "Finished commissions shown on the commissions page, newest first. Add the portrait photo(s) and what the owner said about it.",
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      admin: {
        description: "e.g. Wally in the Garden",
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "subject",
          type: "text",
          admin: {
            description: "e.g. Golden Retriever, or the pet's name and breed",
          },
        },
        {
          name: "year",
          type: "number",
          admin: {
            description: "Year painted",
          },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "medium",
          type: "text",
          defaultValue: "Acrylic on canvas",
        },
        {
          name: "widthIn",
          label: "Width (in)",
          type: "number",
        },
        {
          name: "heightIn",
          label: "Height (in)",
          type: "number",
        },
      ],
    },
    {
      name: "images",
      type: "array",
      minRows: 1,
      required: true,
      labels: { singular: "Image", plural: "Images" },
      admin: {
        description:
          "First image is the one shown on the commissions page. A photo of the portrait in the owner's home works beautifully.",
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
      name: "ownerQuote",
      label: "Owner's comment",
      type: "textarea",
      admin: {
        description:
          "What the owner said when they received it, in their words. Shown as a quote under the portrait.",
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "ownerName",
          label: "Owner's name",
          type: "text",
          admin: {
            description: "How they'd like to be credited, e.g. Sarah M.",
          },
        },
        {
          name: "ownerLocation",
          label: "Owner's location",
          type: "text",
          admin: {
            description: "e.g. Burlington, Vermont",
          },
        },
      ],
    },
  ],
};
