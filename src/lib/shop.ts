import { getPayloadClient } from "./payload";
import { cleanResidentName } from "@/data/paintings";
import { DEFAULT_SHIPPING, type Product, type ShippingSettings, type ShopImage } from "./shop-shared";

export * from "./shop-shared";

// The Budderlee Village Store, read from the Products collection. Without
// a database (local dev) the shop is empty and shows its empty state.

type MediaDoc = { url?: string | null; width?: number | null; height?: number | null; alt?: string | null };

type ProductDoc = {
  slug: string;
  name: string;
  category: Product["category"];
  description?: string | null;
  images?: Array<{ image?: number | MediaDoc | null }> | null;
  variants?: Array<{ id?: string | null; label: string; price: number; stock?: number | null }> | null;
  seasonal?: string | null;
  resident?: number | { slug?: string; title?: string; characterName?: string | null } | null;
};

function image(m: number | MediaDoc | null | undefined): ShopImage | undefined {
  if (!m || typeof m !== "object" || !m.url) return undefined;
  return { url: m.url, width: m.width ?? undefined, height: m.height ?? undefined, alt: m.alt ?? undefined };
}

// Barbara enters prices in dollars; everything after this works in cents.
function toCents(dollars: number) {
  return Math.round(dollars * 100);
}

function mapProduct(doc: ProductDoc): Product {
  const r = doc.resident && typeof doc.resident === "object" ? doc.resident : undefined;
  return {
    slug: doc.slug,
    name: doc.name,
    category: doc.category,
    description: doc.description?.trim() || undefined,
    images: (doc.images ?? []).map((i) => image(i.image)).filter((i): i is ShopImage => !!i),
    variants: (doc.variants ?? [])
      .filter((v) => v.id)
      .map((v) => ({
        id: v.id!,
        label: v.label,
        priceCents: toCents(v.price),
        stock: v.stock ?? undefined,
      })),
    seasonal: doc.seasonal?.trim() || undefined,
    resident: r?.slug ? { slug: r.slug, name: cleanResidentName(r.characterName || r.title || r.slug) } : undefined,
  };
}

/** Published products in shop order. */
export async function getProducts(): Promise<Product[]> {
  const payload = await getPayloadClient();
  if (!payload) return [];
  try {
    const result = await payload.find({
      collection: "products",
      depth: 1,
      limit: 200,
      sort: ["sortOrder", "-createdAt"],
      where: { status: { equals: "published" } },
    });
    return (result.docs as unknown as ProductDoc[]).map(mapProduct);
  } catch (err) {
    console.error("[shop] Payload query failed:", err);
    return [];
  }
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  return (await getProducts()).find((p) => p.slug === slug);
}

/** Shipping as set in the admin's Store Settings. */
export async function getShippingSettings(): Promise<ShippingSettings> {
  const payload = await getPayloadClient();
  if (!payload) return DEFAULT_SHIPPING;
  try {
    const g = await payload.findGlobal({ slug: "shop-settings" });
    return {
      cents: toCents(g.shipping ?? DEFAULT_SHIPPING.cents / 100),
      freeOverCents: g.freeShippingOver != null ? toCents(g.freeShippingOver) : undefined,
    };
  } catch (err) {
    console.error("[shop] Store Settings query failed:", err);
    return DEFAULT_SHIPPING;
  }
}
