import type { CollectionConfig } from "payload";

// One row per subscriber per issue of The Budderlee Post, created when
// Barbara generates the shipping list at the cutoff. The address is a
// snapshot taken at that moment, so a portal change after labels are
// bought applies to next month, not this batch. Marking a row shipped
// counts the package on the subscriber, which is how "first package"
// and the Founding Member sticker are worked out next time.
export const Shipments: CollectionConfig = {
  slug: "shipments",
  labels: { singular: "Shipment", plural: "Shipments" },
  admin: {
    group: "The Budderlee Post",
    useAsTitle: "label",
    defaultColumns: ["label", "issue", "status", "firstPackage", "includeFoundingSticker", "trackingNumber"],
    description:
      "The shipping list for each issue, generated from the Fulfillment page. Tick rows Shipped as they go out (select several and Edit to do a batch), or use Mark all shipped on the Fulfillment page.",
    listSearchableFields: ["label", "email"],
  },
  access: {
    read: ({ req }) => !!req.user,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        if (!data) return data;
        if (data.status === "shipped" && originalDoc?.status !== "shipped" && !data.shippedAt) {
          data.shippedAt = new Date().toISOString();
        }
        if (!data.label) {
          data.label = data.addressSnapshot?.name || data.email || "Shipment";
        }
        return data;
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, req }) => {
        // Count the package exactly once, on the move to Shipped.
        if (doc?.status !== "shipped" || previousDoc?.status === "shipped") return doc;
        const subId = typeof doc.subscriber === "object" && doc.subscriber ? doc.subscriber.id : doc.subscriber;
        if (!subId) return doc;
        try {
          const sub = await req.payload.findByID({ collection: "subscribers", id: subId, depth: 0, overrideAccess: true });
          await req.payload.update({
            collection: "subscribers",
            id: subId,
            data: { packagesSent: (sub.packagesSent ?? 0) + 1 },
            overrideAccess: true,
          });
        } catch (err) {
          req.payload.logger.error(`[shipments] could not count package for subscriber ${subId}: ${err}`);
        }
        return doc;
      },
    ],
  },
  fields: [
    {
      name: "label",
      type: "text",
      admin: { readOnly: true, description: "The recipient, for the list view." },
    },
    {
      type: "row",
      fields: [
        { name: "issue", type: "relationship", relationTo: "issues", required: true, index: true, admin: { readOnly: true } },
        { name: "subscriber", type: "relationship", relationTo: "subscribers", required: true, index: true, admin: { readOnly: true } },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "status",
          type: "select",
          required: true,
          defaultValue: "pending",
          options: [
            { label: "Pending", value: "pending" },
            { label: "Shipped", value: "shipped" },
            { label: "Skipped", value: "skipped" },
          ],
          admin: { description: "Shipped counts the package for the subscriber. Skipped leaves it out of the CSV." },
        },
        {
          name: "trackingNumber",
          label: "Tracking number",
          type: "text",
          admin: { description: "Optional. Paste from the label tool." },
        },
        {
          name: "shippedAt",
          label: "Shipped",
          type: "date",
          admin: { readOnly: true, date: { pickerAppearance: "dayAndTime" } },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "firstPackage",
          label: "First package",
          type: "checkbox",
          defaultValue: false,
          admin: { readOnly: true, description: "Write the welcome note instead of the thank-you." },
        },
        {
          name: "includeFoundingSticker",
          label: "Founding Member sticker",
          type: "checkbox",
          defaultValue: false,
          admin: { readOnly: true, description: "Founding member's first package: add the sticker." },
        },
      ],
    },
    { name: "email", type: "email", admin: { readOnly: true } },
    {
      name: "addressSnapshot",
      label: "Ship to (as of the cutoff)",
      type: "group",
      fields: [
        { name: "name", type: "text" },
        { name: "line1", type: "text" },
        { name: "line2", type: "text" },
        {
          type: "row",
          fields: [
            { name: "city", type: "text" },
            { name: "state", type: "text" },
            { name: "postalCode", label: "ZIP", type: "text" },
            { name: "country", type: "text" },
          ],
        },
      ],
    },
    {
      name: "notes",
      type: "textarea",
      admin: { description: "Anything about this one package." },
    },
  ],
};
