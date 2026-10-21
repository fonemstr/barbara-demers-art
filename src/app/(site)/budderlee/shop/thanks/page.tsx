import { BdButton, SectionTitle } from "@/components/budderlee/parts";
import { ClearBasket } from "@/components/budderlee/shop/basket-view";

export const metadata = {
  title: "Thank you: The Village Store of Budderlee",
  robots: { index: false, follow: false },
};

export default function ShopThanksPage() {
  return (
    <section className="mx-auto max-w-2xl px-6 py-16 text-center">
      <ClearBasket />
      <SectionTitle as="h1">Thank You</SectionTitle>
      <p className="mt-6 text-lg leading-relaxed">
        Your order is in. Stripe will email your receipt, and Barbara will pack your order by hand and mail it from
        her studio. You&rsquo;ll get another email when it&rsquo;s on its way.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <BdButton href="/budderlee/shop">Back to the Village Store</BdButton>
        <BdButton href="/budderlee/tales" outline>
          Read a Tale
        </BdButton>
      </div>
    </section>
  );
}
