import { getProducts, getShippingSettings } from "@/lib/shop";
import { SectionTitle } from "@/components/budderlee/parts";
import { BasketView } from "@/components/budderlee/shop/basket-view";

export const metadata = {
  title: "Your basket: The Village Store of Budderlee",
  robots: { index: false, follow: false },
};

// Rendered for every visit, never from a cached copy: a stale product
// list would make what's in the basket look like it had left the shop.
export const dynamic = "force-dynamic";

export default async function BasketPage() {
  const [products, shippingSettings] = await Promise.all([getProducts(), getShippingSettings()]);
  return (
    <section className="mx-auto max-w-3xl px-6 py-14">
      <SectionTitle as="h1">Your Basket</SectionTitle>
      <BasketView products={products} shippingSettings={shippingSettings} />
    </section>
  );
}
