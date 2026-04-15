import type { CollectionConfig } from "payload";
import {
  lexicalEditor,
  HeadingFeature,
  FixedToolbarFeature,
  InlineToolbarFeature,
} from "@payloadcms/richtext-lexical";

export const JournalPosts: CollectionConfig = {
  slug: "journal-posts",
  labels: {
    singular: "Journal Post",
    plural: "Journal Posts",
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "publishedAt", "updatedAt"],
    description: "Notes from the studio. Published posts appear under /blog.",
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true;
      // Only published posts are public
      return {
        status: { equals: "published" },
      };
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
          "URL-friendly identifier. Used in /blog/[slug].",
      },
    },
    {
      name: "excerpt",
      type: "textarea",
      admin: {
        description: "One or two sentences shown on the journal index page",
      },
    },
    {
      name: "cover",
      type: "upload",
      relationTo: "media",
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
      name: "status",
      type: "select",
      defaultValue: "draft",
      required: true,
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
    },
    {
      name: "publishedAt",
      type: "date",
      admin: {
        description: "Shown as the post date on the journal",
        position: "sidebar",
      },
    },
  ],
};
