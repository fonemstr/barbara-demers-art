import Image from "next/image";
import Link from "next/link";
import { formatPrice, fromPrice, getProducts, soldOut } from "@/lib/shop";
import { SectionTitle } from "@/components/budderlee/parts";
import { BasketLink } from "@/components/budderlee/shop/basket-link";
import s from "@/components/budderlee/budderlee.module.css";

export const metadata = {
  title: "The Village Store of Budderlee",
  alternates: { canonical: "/budderlee/shop" },
  description:
    "Cards and keepsakes from the village of Budderlee, illustrated by Barbara J. Demers and mailed from her studio.",
};

export const revalidate = 60;

export default async function ShopPage() {
  const products = await getProducts();

  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <SectionTitle as="h1">The Village Store</SectionTitle>
      <p className="mx-auto mt-5 max-w-2xl text-center text-lg leading-relaxed">
        Cards and keepsakes from the village, illustrated by Barbara and mailed from her studio.
      </p>
      <div className="mt-3 text-center">
        <BasketLink />
      </div>

      {products.length === 0 ? (
        <p className="mt-12 text-center italic">The shelves are being stocked. Please come back soon.</p>
      ) : (
        <div className={`${s.shopGrid} mt-12`}>
          {products.map((p) => {
            const img = p.images[0];
            const allOut = p.variants.every(soldOut);
            return (
              <Link key={p.slug} href={`/budderlee/shop/${p.slug}`} className={s.shopCard}>
                <div className={`${s.shopThumb} ${s.photo}`}>
                  {img && (
                    <Image
                      src={img.url}
                      alt={img.alt || p.name}
                      fill
                      sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 100vw"
                      className="object-cover"
                    />
                  )}
                  {p.seasonal && <span className={s.shopRibbon}>{p.seasonal}</span>}
                </div>
                <h2 className="mt-4 text-[24px] leading-tight transition-colors">{p.name}</h2>
                <p className="mt-1 text-[17px] text-on-surface-subtle">
                  {allOut ? "Sold out" : `${p.variants.length > 1 ? "From " : ""}${formatPrice(fromPrice(p))}`}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
