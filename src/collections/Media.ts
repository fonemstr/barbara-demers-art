import type { CollectionConfig } from "payload";

function filenameToAlt(filename?: string): string | undefined {
  if (!filename) return undefined;

  const withoutExtension = filename.replace(/\.[^/.]+$/, "");
  const readable = withoutExtension
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return readable || undefined;
}

export const Media: CollectionConfig = {
  slug: "media",
  access: {
    read: () => true,
  },
  hooks: {
    beforeValidate: [
      ({ data, req }) => {
        if (!data || data.alt) return data;

        const uploadedFile = req.file as
          | { name?: string; filename?: string }
          | undefined;

        const fallbackAlt = filenameToAlt(
          uploadedFile?.name || uploadedFile?.filename || data.filename
        );

        if (fallbackAlt) {
          return {
            ...data,
            alt: fallbackAlt,
          };
        }

        return data;
      },
    ],
  },
  upload: {
    staticDir: "media",
    imageSizes: [
      { name: "thumbnail", width: 400, height: 500, position: "centre" },
      { name: "card", width: 800, height: 1000, position: "centre" },
      { name: "feature", width: 1600, height: 2000, position: "centre" },
    ],
    adminThumbnail: "thumbnail",
    mimeTypes: ["image/*"],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
      admin: {
        description:
          "Describe the image for screen readers and SEO. Bulk uploads are automatically filled from the filename; edit this after upload when needed.",
      },
    },
  ],
};
