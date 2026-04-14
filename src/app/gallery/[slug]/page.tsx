import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { paintings, getPainting, SHIPPING_RATES } from "@/data/paintings";
import { formatPrice } from "@/lib/utils";
import { BuyButton } from "@/components/buy-button";

export function generateStaticParams() {
  return paintings.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const painting = getPainting(slug);
  if (!painting) return {};
  return {
    title: painting.title,
    description: painting.description,
  };
}

export default async function PaintingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const painting = getPainting(slug);
  if (!painting) notFound();

  const shipping = SHIPPING_RATES[painting.sizeTier];

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <Link
        href="/gallery"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to gallery
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mt-8">
        <div className="md:col-span-3">
          <div className="relative aspect-[4/5] bg-muted">
            <Image
              src={painting.images[0]}
              alt={painting.title}
              fill
              sizes="(min-width: 768px) 60vw, 100vw"
              className="object-cover"
              priority
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground">
            {painting.subject} · {painting.year}
          </p>
          <h1 className="font-serif text-3xl md:text-4xl mt-3">
            {painting.title}
          </h1>

          <dl className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Medium</dt>
              <dd>{painting.medium}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Dimensions</dt>
              <dd>
                {painting.widthIn} × {painting.heightIn} in
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="text-right">
                {formatPrice(shipping.cents)}
                <br />
                <span className="text-xs text-muted-foreground">
                  {shipping.label}
                </span>
              </dd>
            </div>
          </dl>

          <p className="mt-8 text-muted-foreground leading-relaxed">
            {painting.description}
          </p>

          <div className="mt-10 border-t border-border pt-6">
            {painting.sold ? (
              <div>
                <p className="text-2xl font-serif text-muted-foreground line-through">
                  {formatPrice(painting.priceCents)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  This piece has sold. For similar work, consider a{" "}
                  <Link
                    href="/commissions"
                    className="underline underline-offset-4"
                  >
                    commission
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <>
                <p className="text-3xl font-serif tabular-nums">
                  {formatPrice(painting.priceCents)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  + {formatPrice(shipping.cents)} shipping
                </p>
                <div className="mt-6">
                  <BuyButton slug={painting.slug} />
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Secure checkout by Stripe. Packed and shipped directly from
                  the studio within 5 business days.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
