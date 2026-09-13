import type { CollectionConfig } from "payload";

// One Issue per mailing of The Budderlee Post. It holds everything that
// prints for that month: which resident, the Tales from Budderlee chapter,
// the recipe, and the sticker, plus a status Barbara moves along as the
// month progresses. The shipping list (a later phase) hangs off this too.
export const Issues: CollectionConfig = {
  slug: "issues",
  labels: { singular: "Issue", plural: "Issues" },
  admin: {
    group: "The Budderlee Post",
    useAsTitle: "title",
    defaultColumns: ["title", "resident", "status", "mailingMonth"],
    description:
      "One issue per mailing month. The title fills itself in from the month and the resident when you save.",
  },
  access: {
    read: ({ req }) => !!req.user,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        if (!data?.mailingMonth) return data;
        const month = new Date(data.mailingMonth).toLocaleString("en-US", {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        });
        let who = "";
        const residentId =
          typeof data.resident === "object" && data.resident
            ? (data.resident as { id?: number }).id
            : data.resident;
        if (residentId) {
          try {
            const doc = await req.payload.findByID({
              collection: "paintings",
              id: residentId,
              depth: 0,
            });
            who = doc.characterName || doc.title || "";
          } catch {
            // an unknown resident just leaves the title as the month
          }
        }
        data.title = who ? `${month} · ${who}` : month;
        return data;
      },
    ],
  },
  fields: [
    {
      name: "title",
      type: "text",
      admin: { readOnly: true, description: "Set automatically on save." },
    },
    {
      type: "row",
      fields: [
        {
          name: "mailingMonth",
          label: "Mailing month",
          type: "date",
          required: true,
          unique: true,
          admin: {
            date: { pickerAppearance: "monthOnly", displayFormat: "MMMM yyyy" },
            description: "The month the packages go out (first week).",
          },
        },
        {
          name: "resident",
          type: "relationship",
          relationTo: "paintings",
          required: true,
          filterOptions: { collection: { equals: "budderlee" } },
          admin: { description: "The resident on this month's card." },
        },
        {
          name: "status",
          type: "select",
          required: true,
          defaultValue: "planning",
          options: [
            { label: "Planning", value: "planning" },
            { label: "At the printer", value: "printer" },
            { label: "Ready to ship", value: "ready" },
            { label: "Shipped", value: "shipped" },
          ],
        },
      ],
    },
    {
      name: "storyTitle",
      label: "Tales from Budderlee: chapter title",
      type: "text",
    },
    {
      name: "story",
      label: "Tales from Budderlee: the chapter",
      type: "richText",
      admin: { description: "This month's chapter. It prints on the folded sheet." },
    },
    {
      name: "recipeTitle",
      label: "Recipe title",
      type: "text",
      admin: { description: "e.g. Maisie's Apple Pie" },
    },
    {
      name: "recipe",
      label: "Recipe",
      type: "richText",
      admin: { description: "Ingredients and method, as they should print on the 4×6 card." },
    },
    {
      name: "stickerNote",
      label: "Sticker",
      type: "text",
      admin: { description: "What this month's sticker is, for your own tracking." },
    },
    {
      name: "notes",
      type: "textarea",
      admin: { description: "Anything else about this mailing: vendor orders, counts, reminders." },
    },
    {
      name: "shippingListGeneratedAt",
      label: "Shipping list generated",
      type: "date",
      admin: {
        position: "sidebar",
        readOnly: true,
        date: { pickerAppearance: "dayAndTime" },
        description: "Set when the shipping list is generated at the cutoff (coming in a later release).",
      },
    },
  ],
};
