import type { CollectionConfig } from "payload";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import { FROM_EMAIL, TO_EMAIL, requireResend } from "../lib/resend";
import {
  renderNewsletterHtml,
  resolveCollectorSegmentId,
  syncAllContactsIntoSegment,
} from "../lib/newsletter-email";

// Compose newsletters in the admin and send them to the collector list
// through Resend broadcasts — no dashboard hopping. Same send mechanics
// as Social Posts: flip the status and save.
export const Newsletters: CollectionConfig = {
  slug: "newsletters",
  admin: {
    useAsTitle: "subject",
    defaultColumns: ["subject", "status", "sentAt"],
    description:
      "Write a newsletter, set status to “Send me a test” to preview it in your own inbox, then “Send to the collector list” and save. Unsubscribes are handled automatically.",
  },
  access: {
    // Internal tool — admin users only.
    read: ({ req }) => !!req.user,
  },
  fields: [
    {
      name: "subject",
      type: "text",
      required: true,
      admin: {
        description: "The email subject line.",
      },
    },
    {
      name: "previewText",
      label: "Preview text",
      type: "text",
      admin: {
        description:
          "Optional. The short snippet inboxes show next to the subject. Falls back to the first line of the newsletter.",
      },
    },
    {
      name: "body",
      type: "richText",
      required: true,
      admin: {
        description:
          "The newsletter itself. Headings, links, and images all work — images are best uploaded landscape and under ~1MB.",
      },
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "draft",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Send me a test", value: "test" },
        { label: "Send to the collector list", value: "send" },
        { label: "Sent", value: "sent" },
        { label: "Failed", value: "failed" },
      ],
      admin: {
        description:
          "“Send me a test” emails only the studio and returns to Draft. “Send to the collector list” goes to every subscriber. Both happen when you save.",
      },
    },
    {
      name: "sentAt",
      label: "Sent at",
      type: "date",
      admin: {
        readOnly: true,
        date: { pickerAppearance: "dayAndTime" },
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
      async ({ data }) => {
        if (data?.status !== "test" && data?.status !== "send") return data;
        const isTest = data.status === "test";
        try {
          const resend = requireResend();
          const html = renderNewsletterHtml(
            data.body as SerializedEditorState,
            { forTest: isTest },
          );

          if (isTest) {
            const sent = await resend.emails.send({
              from: FROM_EMAIL,
              to: TO_EMAIL,
              subject: `[Test] ${data.subject}`,
              html,
            });
            if (sent.error) throw new Error(sent.error.message);
            data.status = "draft";
            data.result = `Test sent to ${TO_EMAIL}. Check the inbox, then set “Send to the collector list” and save.`;
          } else {
            const segmentId = await resolveCollectorSegmentId(resend);
            if (!segmentId) {
              throw new Error(
                "No segment found in Resend to send to. Create one named “General” under Audience → Segments in the Resend dashboard.",
              );
            }
            const total = await syncAllContactsIntoSegment(resend, segmentId);
            const broadcast = await resend.broadcasts.create({
              segmentId,
              from: FROM_EMAIL,
              replyTo: TO_EMAIL,
              subject: data.subject as string,
              previewText: (data.previewText as string) || undefined,
              name: data.subject as string,
              html,
              send: true,
            });
            if (broadcast.error) throw new Error(broadcast.error.message);
            data.status = "sent";
            data.sentAt = new Date().toISOString();
            data.result = `Sent to the collector list — ${total} contact${total === 1 ? "" : "s"}, minus unsubscribes. Broadcast ${broadcast.data?.id ?? ""} (delivery details in the Resend dashboard).`;
          }
        } catch (err) {
          data.status = "failed";
          data.result = `${isTest ? "Test send" : "Send"} failed: ${err instanceof Error ? err.message : String(err)}`;
        }
        return data;
      },
    ],
  },
};
