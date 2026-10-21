import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getProducts, getShippingSettings, shippingNote } from "@/lib/shop";
import { Ornament } from "@/components/budderlee/parts";
import { AddToBasket } from "@/components/budderlee/shop/add-to-basket";
import { BasketLink } from "@/components/budderlee/shop/basket-link";
import s from "@/components/budderlee/budderlee.module.css";

export const revalidate = 60;

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  const description = product.description ?? `${product.name}, from the Village Store of Budderlee.`;
  return {
    title: `${product.name}: The Village Store of Budderlee`,
    description,
    alternates: { canonical: `/budderlee/shop/${product.slug}` },
    openGraph: {
      siteName: "Barbara J Demers",
      title: product.name,
      description,
      images: product.images[0] ? [{ url: product.images[0].url }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, shippingSettings] = await Promise.all([getProduct(slug), getShippingSettings()]);
  if (!product) notFound();
  const [main, ...more] = product.images;

  return (
    <article className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/budderlee/shop" className="text-[15px] text-on-surface-subtle hover:text-on-surface">
          <span aria-hidden="true">←</span> The Village Store
        </Link>
        <BasketLink />
      </div>

      <div className="mt-8 grid items-start gap-10 md:grid-cols-[1.05fr_0.95fr]">
        <div>
          {main && (
            <Image
              src={main.url}
              alt={main.alt || product.name}
              width={main.width ?? 1200}
              height={main.height ?? 1200}
              sizes="(min-width: 768px) 32rem, 100vw"
              className={`${s.photo} h-auto w-full`}
              priority
            />
          )}
          {more.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {more.map((img) => (
                <Image
                  key={img.url}
                  src={img.url}
                  alt={img.alt || ""}
                  width={img.width ?? 600}
                  height={img.height ?? 600}
                  sizes="(min-width: 768px) 10rem, 33vw"
                  className={`${s.photo} h-auto w-full`}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          {product.seasonal && (
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--bd-rust)]">{product.seasonal}</p>
          )}
          <h1 className="mt-2 text-[38px] leading-[1.08] md:text-[46px]">{product.name}</h1>
          <Ornament />
          {product.resident && (
            <p className="mt-3 text-[16px] italic text-on-surface-subtle">
              Featuring{" "}
              <Link href={`/budderlee/residents/${product.resident.slug}`} className="underline underline-offset-4">
                {product.resident.name}
              </Link>
            </p>
          )}
          {product.description && (
            <p className="mt-5 whitespace-pre-line text-[18px] leading-relaxed">{product.description}</p>
          )}

          <AddToBasket slug={product.slug} variants={product.variants} />

          <p className="mt-6 border-t border-[var(--bd-line)] pt-4 text-[15px] text-on-surface-subtle">
            Mailed by Barbara from her studio. {shippingNote(shippingSettings)} US addresses only.
          </p>
        </div>
      </div>
    </article>
  );
}
