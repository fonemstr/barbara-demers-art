import type { CollectionConfig } from "payload";
import { sendSocialPost, SOCIAL_PLATFORM_OPTIONS, type SocialPlatform } from "../lib/social-direct";

export const SocialPosts: CollectionConfig = {
  slug: "social-posts",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "status", "scheduleAt", "updatedAt"],
    description:
      "Compose once, post everywhere. Set status to “Send” and save — the post goes out now, or at the scheduled time if one is set. Auto-announced paintings appear here too, as a record.",
  },
  access: {
    // Internal marketing tool — admin users only, nothing public.
    read: ({ req }) => !!req.user,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      admin: {
        description: "Internal label — not part of the post. e.g. “Maisie arrival announcement”",
      },
    },
    {
      name: "message",
      type: "textarea",
      required: true,
      admin: {
        description:
          "The post text. Keep under 280 characters if X is selected — longer text is truncated there.",
        rows: 5,
      },
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      admin: {
        description: "Optional image. Instagram and Pinterest require one.",
      },
    },
    {
      name: "platforms",
      type: "select",
      hasMany: true,
      defaultValue: ["instagram", "facebook"],
      options: SOCIAL_PLATFORM_OPTIONS,
      admin: {
        description:
          "Which accounts to post to. Credentials are configured in the environment — see SOCIAL.md.",
      },
    },
    {
      name: "scheduleAt",
      label: "Schedule for",
      type: "date",
      admin: {
        date: { pickerAppearance: "dayAndTime" },
        description:
          "Leave empty to post immediately when sent. Set a future date/time for a timed release.",
      },
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "draft",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Send", value: "send" },
        { label: "Scheduled", value: "scheduled" },
        { label: "Posted", value: "posted" },
        { label: "Failed", value: "failed" },
      ],
      admin: {
        description:
          "Set to “Send” and save to deliver. It becomes Posted (or Scheduled), or Failed with the reason below. To retry after a failure, fix the issue and set “Send” again.",
      },
    },
    {
      name: "result",
      type: "textarea",
      admin: {
        readOnly: true,
        description: "Delivery report from the last send attempt.",
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        if (data?.status !== "send") return data;

        // A future schedule time queues the post in the database; the cron
        // endpoint (/api/cron/social-posts) delivers it when it comes due.
        // Times are stored as absolute UTC instants, so server timezone is
        // irrelevant.
        if (data.scheduleAt && new Date(data.scheduleAt).getTime() > Date.now()) {
          data.status = "scheduled";
          data.result = `Queued — will post after ${new Date(data.scheduleAt).toISOString()} (checked every 15 minutes).`;
          return data;
        }

        let mediaUrls: string[] = [];
        if (data.image) {
          const media = await req.payload
            .findByID({ collection: "media", id: data.image, overrideAccess: true })
            .catch(() => null);
          if (media?.url) mediaUrls = [media.url];
        }

        const result = await sendSocialPost({
          post: data.message ?? "",
          platforms: (data.platforms ?? []) as SocialPlatform[],
          mediaUrls,
        });

        data.status = result.ok ? "posted" : "failed";
        data.result = result.summary;
        return data;
      },
    ],
  },
};
