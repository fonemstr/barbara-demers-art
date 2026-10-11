import type { GlobalConfig } from "payload";

// Content for the Budderlee welcome page that isn't tied to one painting,
// tale or subscription setting.
export const BudderleePage: GlobalConfig = {
  slug: "budderlee-page",
  label: "Budderlee Page",
  admin: {
    group: "The Budderlee Post",
    description: "Content for the Budderlee welcome page (/budderlee). Updates within a minute of saving.",
  },
  access: {
    read: () => true,
    update: ({ req }) => !!req.user,
  },
  hooks: {
    afterChange: [
      async () => {
        try {
          const { revalidatePath } = await import("next/cache");
          revalidatePath("/budderlee");
          revalidatePath("/budderlee/residents");
          revalidatePath("/budderlee/residents/[slug]", "page");
        } catch {
          // outside a request context (scripts, migrations)
        }
      },
    ],
  },
  fields: [
    {
      name: "originalsPhoto",
      label: "Framed original with its package",
      type: "upload",
      relationTo: "media",
      admin: {
        description:
          "A photograph of a framed original resident painting together with the package it ships in. Shown under \"Bring a resident home\".",
      },
    },
    {
      name: "originalsIncludes",
      label: "What an original includes",
      type: "textarea",
      admin: {
        description:
          "One or two sentences on what comes with an original resident painting. Shown on the Budderlee page and on every resident's page.",
      },
    },
  ],
};
