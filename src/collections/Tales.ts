import type { CollectionConfig } from "payload";
import {
  lexicalEditor,
  HeadingFeature,
  FixedToolbarFeature,
  InlineToolbarFeature,
} from "@payloadcms/richtext-lexical";

// Tales of Budderlee: stories of the one village, each seen through a
// resident's eyes. Kept apart from the studio Journal. Published tales
// appear at /budderlee/tales/[slug].
async function revalidateTalePaths(slugs: (string | undefined)[]) {
  try {
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/budderlee");
    revalidatePath("/budderlee/tales");
    revalidatePath("/budderlee/residents/[slug]", "page");
    for (const slug of slugs) {
      if (slug) revalidatePath(`/budderlee/tales/${slug}`);
    }
  } catch {
    // outside a request context (scripts, migrations): nothing to do
  }
}

export const Tales: CollectionConfig = {
  slug: "tales",
  labels: {
    singular: "Tale",
    plural: "Tales of Budderlee",
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "resident", "status", "publishedAt"],
    description:
      "Stories of Budderlee, each told through one resident. Published tales appear under /budderlee/tales.",
  },
  hooks: {
    afterChange: [
      async ({ doc, previousDoc }) => {
        await revalidateTalePaths([doc?.slug, previousDoc?.slug]);
        return doc;
      },
    ],
    afterDelete: [
      async ({ doc }) => {
        await revalidateTalePaths([doc?.slug]);
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
          "URL-friendly identifier. Lowercase, dashes instead of spaces (e.g. pippa-and-the-candied-apples).",
      },
    },
    {
      name: "resident",
      type: "relationship",
      relationTo: "paintings",
      filterOptions: { collection: { equals: "budderlee" } },
      admin: {
        description: "Whose eyes the story is told through. Their painting illustrates the tale and links to it.",
      },
    },
    {
      name: "excerpt",
      type: "textarea",
      admin: {
        description: "A short introduction for the story cards and the Budderlee page.",
      },
    },
    {
      name: "cover",
      type: "upload",
      relationTo: "media",
      admin: {
        description: "Optional illustration for the top of the story. The resident's painting is used when left empty.",
      },
    },
    {
      name: "body",
      type: "richText",
      required: true,
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          HeadingFeature({ enabledHeadingSizes: ["h2", "h3"] }),
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ],
      }),
    },
    {
      name: "featured",
      type: "checkbox",
      defaultValue: false,
      label: "Feature on the Budderlee page",
      admin: {
        position: "sidebar",
        description: "Shown in \"Step into a story\". If several are ticked, the newest wins.",
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
      admin: { position: "sidebar" },
    },
    {
      name: "publishedAt",
      type: "date",
      admin: { position: "sidebar" },
    },
  ],
};
