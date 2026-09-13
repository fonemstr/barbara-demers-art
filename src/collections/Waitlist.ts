import type { CollectionConfig } from "payload";

// People who asked to hear when The Budderlee Post opens. Kept here and
// not as Resend contacts on purpose: the Newsletters tool sweeps every
// Resend contact into the collector list before each send, and Barbara
// wants this list kept completely separate. Rows are created by the
// public form through the local API; the admin is for reading, counting,
// and marking who has been invited.
export const Waitlist: CollectionConfig = {
  slug: "waitlist",
  labels: { singular: "Waitlist signup", plural: "Waitlist" },
  admin: {
    group: "The Budderlee Post",
    useAsTitle: "email",
    defaultColumns: ["email", "name", "joinedAt", "invitedAt", "subscribedAt"],
    description:
      "Everyone waiting for The Budderlee Post to open. Signups arrive from the form at /budderlee/post.",
  },
  access: {
    read: ({ req }) => !!req.user,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return data;
        if (typeof data.email === "string") {
          data.email = data.email.trim().toLowerCase();
        }
        if (typeof data.name === "string") data.name = data.name.trim();
        if (!data.joinedAt) data.joinedAt = new Date().toISOString();
        return data;
      },
    ],
  },
  fields: [
    {
      name: "email",
      type: "email",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "name",
      type: "text",
      admin: { description: "Optional. Whatever they typed on the form." },
    },
    {
      name: "source",
      type: "text",
      admin: {
        description: "Where the signup came from, e.g. budderlee-post-page.",
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "joinedAt",
          label: "Joined",
          type: "date",
          admin: { date: { pickerAppearance: "dayAndTime" } },
        },
        {
          name: "invitedAt",
          label: "Invited",
          type: "date",
          admin: {
            date: { pickerAppearance: "dayAndTime" },
            description: "Set when the launch invitation goes out.",
          },
        },
        {
          name: "subscribedAt",
          label: "Subscribed",
          type: "date",
          admin: {
            date: { pickerAppearance: "dayAndTime" },
            description: "Set when they become a paying subscriber.",
          },
        },
      ],
    },
  ],
};
