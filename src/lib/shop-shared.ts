// The Village Store's types, prices and order encoding, shared by the
// server and the browser cart. Nothing here may import server-only code.

// Shipping is one flat charge per order, whatever is in the basket, set
// by Barbara in the admin's Store Settings; orders over an optional
// amount ship free. Barbara mails the cards herself.
export type ShippingSettings = { cents: number; freeOverCents?: number };

export const DEFAULT_SHIPPING: ShippingSettings = { cents: 500 };

/** What shipping costs for a basket with this subtotal. */
export function shippingFor(subtotalCents: number, settings: ShippingSettings) {
  const free = settings.cents === 0 || (settings.freeOverCents !== undefined && subtotalCents >= settings.freeOverCents);
  return free ? { label: "Free shipping", cents: 0 } : { label: "Shipping, flat rate", cents: settings.cents };
}

/** "$5 flat shipping per order", with the free-shipping threshold if there is one. */
export function shippingNote(settings: ShippingSettings) {
  if (settings.cents === 0) return "Free shipping.";
  const free = settings.freeOverCents !== undefined ? ` Free on orders of ${formatPrice(settings.freeOverCents)} or more.` : "";
  return `${formatPrice(settings.cents)} flat shipping per order, however many you buy.${free}`;
}

// The most of any one option a single order can hold.
export const MAX_QUANTITY = 20;

export type ShopImage = { url: string; width?: number; height?: number; alt?: string };

export type ShopVariant = {
  id: string;
  label: string;
  priceCents: number;
  /** How many are left; undefined means no limit. */
  stock?: number;
};

export type Product = {
  slug: string;
  name: string;
  category: "cards" | "apparel" | "gifts";
  description?: string;
  images: ShopImage[];
  variants: ShopVariant[];
  seasonal?: string;
  resident?: { slug: string; name: string };
};

export function soldOut(v: ShopVariant) {
  return v.stock !== undefined && v.stock <= 0;
}

/** The lowest price, for "from $X" on the shop cards. */
export function fromPrice(p: Product) {
  return Math.min(...p.variants.map((v) => v.priceCents));
}

export function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

// What a paid order holds, kept on the Stripe session's metadata as
// "variantId~quantity" entries joined by commas, so the webhook can lower
// stock. Option ids are unique across products. Stripe caps a metadata
// value at 500 characters, which MAX_LINES keeps well inside.
export const MAX_LINES = 15;

export type OrderLine = { variantId: string; quantity: number };

export function encodeOrderLines(lines: OrderLine[]) {
  return lines.map((l) => `${l.variantId}~${l.quantity}`).join(",");
}

export function decodeOrderLines(value: string | undefined | null): OrderLine[] {
  if (!value) return [];
  return value.split(",").flatMap((part) => {
    const [variantId, qty] = part.split("~");
    const quantity = Number(qty);
    return variantId && quantity > 0 ? [{ variantId, quantity }] : [];
  });
}
