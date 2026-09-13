import type { CollectionConfig } from "payload";

// Subscribers to The Budderlee Post. Every row is written by the Stripe
// webhook and mirrors Stripe: status, renewal date, shipping address.
// Barbara reads it, adds notes, and the shipping list is built from it.
// Nothing here should be edited by hand except Notes; the next webhook
// event would overwrite it.
export const Subscribers: CollectionConfig = {
  slug: "subscribers",
  labels: { singular: "Subscriber", plural: "Subscribers" },
  admin: {
    group: "The Budderlee Post",
    useAsTitle: "email",
    defaultColumns: ["email", "name", "status", "foundingMember", "currentPeriodEnd", "packagesSent"],
    description:
      "Everyone subscribed to The Budderlee Post, kept in step with Stripe automatically. Change cards, addresses, and cancellations in Stripe or through the subscriber's own portal link; only Notes is yours to edit here.",
  },
  access: {
    read: ({ req }) => !!req.user,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    {
      type: "row",
      fields: [
        { name: "email", type: "email", required: true, index: true, admin: { readOnly: true } },
        { name: "name", type: "text", admin: { readOnly: true } },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "status",
          type: "select",
          required: true,
          defaultValue: "active",
          options: [
            { label: "Active", value: "active" },
            { label: "Signed up, first charge pending", value: "trialing" },
            { label: "Past due", value: "past_due" },
            { label: "Paused", value: "paused" },
            { label: "Canceled", value: "canceled" },
            { label: "Incomplete", value: "incomplete" },
          ],
          admin: { readOnly: true, description: "Mirrors Stripe." },
        },
        {
          name: "foundingMember",
          label: "Founding member",
          type: "checkbox",
          defaultValue: false,
          admin: { description: "Was on the waitlist and subscribed at launch. Gets the Founding Member sticker in the first package." },
        },
        {
          name: "packagesSent",
          label: "Packages sent",
          type: "number",
          defaultValue: 0,
          min: 0,
          admin: { readOnly: true, description: "Counted when a shipment is marked shipped. Zero means the next package is their first." },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "currentPeriodEnd",
          label: "Next renewal",
          type: "date",
          admin: { readOnly: true, date: { pickerAppearance: "dayAndTime" } },
        },
        {
          name: "trialEnd",
          label: "First charge on",
          type: "date",
          admin: {
            readOnly: true,
            date: { pickerAppearance: "dayAndTime" },
            description: "Only set for signups after the cutoff, whose first charge waits for the next cutoff.",
          },
        },
        {
          name: "startedAt",
          label: "Subscribed",
          type: "date",
          admin: { readOnly: true, date: { pickerAppearance: "dayAndTime" } },
        },
      ],
    },
    {
      name: "shippingAddress",
      label: "Shipping address",
      type: "group",
      admin: { description: "Synced from Stripe whenever the subscriber updates it." },
      fields: [
        { name: "name", type: "text", admin: { readOnly: true } },
        { name: "line1", type: "text", admin: { readOnly: true } },
        { name: "line2", type: "text", admin: { readOnly: true } },
        {
          type: "row",
          fields: [
            { name: "city", type: "text", admin: { readOnly: true } },
            { name: "state", type: "text", admin: { readOnly: true } },
            { name: "postalCode", label: "ZIP", type: "text", admin: { readOnly: true } },
            { name: "country", type: "text", admin: { readOnly: true } },
          ],
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "canceledAt",
          label: "Canceled",
          type: "date",
          admin: { readOnly: true, date: { pickerAppearance: "dayAndTime" } },
        },
        {
          name: "cancelReason",
          label: "Cancel reason",
          type: "text",
          admin: { readOnly: true, description: "What they chose in the portal, if anything." },
        },
      ],
    },
    {
      name: "notes",
      type: "textarea",
      admin: { description: "Yours. Allergies, gift notes, anything to remember when packing." },
    },
    {
      type: "row",
      admin: { position: "sidebar" },
      fields: [
        { name: "stripeCustomerId", label: "Stripe customer", type: "text", index: true, admin: { readOnly: true } },
        { name: "stripeSubscriptionId", label: "Stripe subscription", type: "text", unique: true, index: true, admin: { readOnly: true } },
      ],
    },
  ],
};
