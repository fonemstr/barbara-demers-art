import type { GlobalConfig } from "payload";

// One settings record for The Budderlee Post, the monthly subscription.
// Barbara flips the phase, sets the cap, and names the next mailing here
// without a deploy. The public page at /budderlee/post reads it.
export const BudderleePost: GlobalConfig = {
  slug: "budderlee-post",
  label: "The Budderlee Post",
  admin: {
    group: "The Budderlee Post",
    description:
      "Settings for the monthly subscription. The page at /budderlee/post updates within a minute of saving.",
  },
  access: {
    // The public page reads through the local API; the admin form is for
    // signed-in users only.
    read: () => true,
    update: ({ req }) => !!req.user,
  },
  hooks: {
    afterChange: [
      async () => {
        try {
          const { revalidatePath } = await import("next/cache");
          revalidatePath("/budderlee/post");
          revalidatePath("/budderlee");
        } catch {
          // outside a request context (scripts, migrations)
        }
      },
    ],
  },
  fields: [
    {
      name: "phase",
      type: "select",
      required: true,
      defaultValue: "waitlist",
      options: [
        { label: "Waitlist — collecting interest, no signups yet", value: "waitlist" },
        { label: "Open — taking subscriptions", value: "open" },
        { label: "Closed — no signups, no waitlist", value: "closed" },
      ],
      admin: {
        description:
          "What the page offers visitors. Leave on Waitlist until the accountant's sales-tax guidance is in and Stripe is set up.",
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "nextMailing",
          label: "Next mailing",
          type: "text",
          defaultValue: "November 2026",
          admin: {
            description: "Shown on the page and in emails, e.g. “November 2026”.",
          },
        },
        {
          name: "firstResident",
          label: "Featured resident",
          type: "relationship",
          relationTo: "paintings",
          admin: {
            description:
              "The resident shown on the page as the next one in the mail. Walter for the first mailing.",
          },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "subscriberCap",
          label: "Subscriber cap",
          type: "number",
          min: 0,
          defaultValue: 100,
          admin: {
            description: "Active subscribers allowed. Once reached, visitors go back to the waitlist.",
          },
        },
        {
          name: "cutoffDay",
          label: "Cutoff day",
          type: "number",
          min: 1,
          max: 28,
          defaultValue: 15,
          admin: {
            description: "Signups through this day of the month get the next mailing.",
          },
        },
        {
          name: "priceCents",
          label: "Price (cents)",
          type: "number",
          min: 0,
          defaultValue: 1200,
          admin: {
            description: "$12 = 1200. Shown on the page; the Stripe Price must match.",
          },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "foundingWindowEnds",
          label: "Founding window ends",
          type: "date",
          defaultValue: "2026-10-15T00:00:00.000Z",
          admin: {
            date: { pickerAppearance: "dayOnly" },
            description:
              "Waitlist members who subscribe before this date are founding members and get the Founding Member sticker.",
          },
        },
        {
          name: "stripePriceId",
          label: "Stripe price ID",
          type: "text",
          admin: {
            description:
              "From the Stripe dashboard once the product is created (starts with price_). Needed before the phase can be Open.",
          },
        },
      ],
    },
  ],
};
