import type { GlobalConfig } from "payload";

// Settings for the Budderlee Village Store that apply to every order:
// what shipping costs. Barbara changes them here without a deploy; each
// product's own prices are set on the product.
export const ShopSettings: GlobalConfig = {
  slug: "shop-settings",
  label: "Store Settings",
  admin: {
    group: "Village Store",
    description: "Shipping for the Village Store at /budderlee/shop. The shop updates within a minute of saving.",
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
          revalidatePath("/budderlee/shop", "layout");
        } catch {
          // outside a request context (scripts, migrations)
        }
      },
    ],
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "shipping",
          label: "Shipping per order ($)",
          type: "number",
          required: true,
          defaultValue: 5,
          min: 0,
          admin: {
            step: 0.01,
            width: "50%",
            description: "One flat charge per order, however many things are in it. 0 = free shipping.",
          },
        },
        {
          name: "freeShippingOver",
          label: "Free shipping on orders of ($)",
          type: "number",
          min: 0,
          admin: {
            step: 0.01,
            width: "50%",
            description: "Optional. Orders of this much or more (before tax and shipping) ship free. Leave empty to always charge shipping.",
          },
        },
      ],
    },
  ],
};
