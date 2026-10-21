import { getProducts, getShippingSettings } from "@/lib/shop";
import { SectionTitle } from "@/components/budderlee/parts";
import { BasketView } from "@/components/budderlee/shop/basket-view";

export const metadata = {
  title: "Your basket: The Village Store of Budderlee",
  robots: { index: false, follow: false },
};

export const revalidate = 60;

export default async function BasketPage() {
  const [products, shippingSettings] = await Promise.all([getProducts(), getShippingSettings()]);
  return (
    <section className="mx-auto max-w-3xl px-6 py-14">
      <SectionTitle as="h1">Your Basket</SectionTitle>
      <BasketView products={products} shippingSettings={shippingSettings} />
    </section>
  );
}
