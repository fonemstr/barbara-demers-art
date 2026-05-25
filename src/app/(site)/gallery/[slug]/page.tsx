import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  getAllPaintings,
  getPainting,
  SHIPPING_RATES,
  SUBJECT_GROUP_LABELS,
} from "@/data/paintings";
import { AVAILABILITY_STATUS_LABELS } from "@/data/availability";
import { formatPrice } from "@/lib/utils";
import { BuyButton } from "@/components/buy-button";
import { PaintingCard } from "@/components/painting-card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ArtistNote } from "@/components/ui/artist-note";
import { Chip } from "@/components/ui/chip";
import { Blob } from "@/components/ui/blob";
import { Section } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";

// Known slugs are prerendered at build; new slugs get static-generated on
// first request (dynamicParams defaults to true) and revalidated every
// minute so the page reflects edits from admin.
export const revalidate = 60;

export async function generateStaticParams() {
  const paintings = await getAllPaintings();
  return paintings.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const painting = await getPainting(slug);
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
  const painting = await getPainting(slug);
  if (!painting) notFound();

  const shipping = SHIPPING_RATES[painting.sizeTier];
  const isSold = painting.availabilityStatus === "sold" || painting.sold;
  const isAvailable = painting.availabilityStatus === "available" && !isSold;
  const canCheckout = isAvailable && painting.priceDisplay === "visible";
  const showPrice = painting.priceDisplay !== "hidden";
  const story = painting.story || painting.description;
  const allPaintings = await getAllPaintings();
  const related = allPaintings
    .filter(
      (p) => p.slug !== painting.slug && p.subjectGroup === painting.subjectGroup
    )
    .slice(0, 3);

  return (
    <>
      {/* HERO — image + metadata + buy */}
      <Section tone="surface" pad="md" className="overflow-hidden">
        <Link
          href="/gallery"
          className="relative z-[3] inline-flex items-center gap-1.5 text-sm text-on-surface-muted hover:text-on-surface mb-10"
        >
          <span aria-hidden>←</span> Back to available work
        </Link>

        <div className="grid gap-16 md:grid-cols-[1.25fr_1fr] items-start">
          {/* Image column */}
          <div className="relative">
            <Blob
              size={420}
              color="var(--surface-variant)"
              style={{ left: -80, top: 40, opacity: 0.7 }}
            />
            <div
              className="relative z-[1] overflow-hidden shadow-lifted bg-surface-container-lowest"
              style={{
                aspectRatio: `${painting.widthIn} / ${painting.heightIn}`,
              }}
            >
              <Image
                src={painting.images[0]}
                alt={painting.title}
                fill
                sizes="(min-width: 768px) 60vw, 100vw"
                className="object-cover"
                priority
              />
            </div>
            {/* Detail images, if multiple images */}
            {painting.images.length > 1 && (
              <div className="relative z-[1] mt-6">
                <Eyebrow>Look closer</Eyebrow>
                <div className="mt-3 grid grid-cols-4 gap-3">
                  {painting.imageDetails.map((image, i) => (
                    <div key={image.src + i}>
                      <div className="relative aspect-square overflow-hidden bg-surface-container">
                        <Image
                          src={image.src}
                          alt={
                            image.caption ||
                            `${painting.title} — ${i === 0 ? "full painting" : `detail ${i}`}`
                          }
                          fill
                          sizes="15vw"
                          className="object-cover"
                        />
                      </div>
                      {image.caption && (
                        <p className="mt-2 text-xs leading-snug text-on-surface-subtle">
                          {image.caption}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Metadata + buy column */}
          <div className="flex flex-col gap-6 md:pt-6">
            <div className="flex items-center gap-3">
              <Eyebrow>
                {painting.subject || SUBJECT_GROUP_LABELS[painting.subjectGroup]} · {painting.year}
              </Eyebrow>
              <Chip>{AVAILABILITY_STATUS_LABELS[painting.availabilityStatus]}</Chip>
            </div>

            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-[-0.015em] text-balance">
              {painting.title}
            </h1>

            <p className="text-[17px] leading-relaxed text-on-surface-muted text-pretty">
              {painting.storyTeaser || painting.description}
            </p>

            <ArtistNote icon="🎨">
              An original expressive realism painting — created to move beyond
              the photo reference and let the living presence come forward.
            </ArtistNote>

            <div className="rounded-[var(--radius-lg)] bg-surface-container-low p-6">
              <Eyebrow>The story behind the painting</Eyebrow>
              <p className="mt-3 text-[16px] leading-relaxed text-on-surface-muted text-pretty">
                {story}
              </p>
            </div>

            {/* Spec rows — no dividers, just tonal shift */}
            <dl className="mt-2 rounded-[var(--radius-lg)] bg-surface-container-low p-6 grid grid-cols-[auto_1fr] gap-x-10 gap-y-3 text-[15px]">
              <dt className="text-on-surface-subtle">Medium</dt>
              <dd className="text-on-surface">{painting.medium}</dd>
              <dt className="text-on-surface-subtle">Dimensions</dt>
              <dd className="text-on-surface tabular-nums">
                {painting.widthIn} × {painting.heightIn} in
              </dd>
              <dt className="text-on-surface-subtle">Ships from</dt>
              <dd className="text-on-surface">The studio · insured · 5 business days</dd>
              <dt className="text-on-surface-subtle">Shipping</dt>
              <dd className="text-on-surface tabular-nums">
                {canCheckout ? (
                  <>
                    {formatPrice(shipping.cents)}{" "}
                    <span className="text-on-surface-subtle text-[13px]">
                      ({shipping.label})
                    </span>
                  </>
                ) : (
                  "Quoted with inquiry"
                )}
              </dd>
            </dl>

            {/* Price + buy */}
            <div className="mt-4 flex flex-col gap-4">
              {isSold ? (
                <>
                  <div className="flex items-baseline gap-3">
                    {showPrice && (
                      <p className="font-serif text-3xl text-on-surface-faint line-through tabular-nums">
                        {formatPrice(painting.priceCents)}
                      </p>
                    )}
                    <p className="font-serif text-xl text-on-surface">
                      Found a home
                    </p>
                  </div>
                  <p className="text-sm text-on-surface-muted">
                    Love this one? A commission in the same spirit is the
                    next best thing.
                  </p>
                  <ButtonLink href="/commissions" variant="primary" size="md">
                    Ask about a similar commission
                  </ButtonLink>
                </>
              ) : canCheckout ? (
                <>
                  <div className="flex items-baseline gap-3">
                    <p className="font-serif text-4xl tabular-nums text-on-surface">
                      {formatPrice(painting.priceCents)}
                    </p>
                    <p className="text-sm text-on-surface-subtle">
                      + {formatPrice(shipping.cents)} shipping
                    </p>
                  </div>
                  <BuyButton slug={painting.slug} />
                  <p className="text-xs text-on-surface-subtle">
                    Secure checkout by Stripe. Packed and shipped directly
                    from the studio within 5 business days.
                  </p>
                  <p className="rounded-[var(--radius-md)] bg-primary-container-dim px-5 py-4 text-sm font-medium text-on-primary-container">
                    10% of profits from this painting are donated to animal
                    welfare.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-baseline gap-3">
                    {showPrice && (
                      <p className="font-serif text-4xl tabular-nums text-on-surface">
                        {formatPrice(painting.priceCents)}
                      </p>
                    )}
                    <p className="text-sm text-on-surface-subtle">
                      {AVAILABILITY_STATUS_LABELS[painting.availabilityStatus]}
                    </p>
                  </div>
                  {painting.availabilityNote && (
                    <p className="text-sm text-on-surface-muted">
                      {painting.availabilityNote}
                    </p>
                  )}
                  <ButtonLink href="/commissions" variant="primary" size="md">
                    Inquire about this painting
                  </ButtonLink>
                  <p className="rounded-[var(--radius-md)] bg-primary-container-dim px-5 py-4 text-sm font-medium text-on-primary-container">
                    10% of profits from this painting are donated to animal
                    welfare.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* RELATED — more from the same subject group */}
      {related.length > 0 && (
        <Section tone="low" pad="lg">
          <div className="flex items-end justify-between mb-10">
            <div>
              <Eyebrow>More from the studio</Eyebrow>
              <h2 className="mt-3 font-serif text-3xl md:text-4xl leading-[1.1] tracking-[-0.015em]">
                Other {SUBJECT_GROUP_LABELS[painting.subjectGroup].toLowerCase()}
              </h2>
            </div>
            <Link
              href="/gallery"
              className="text-sm text-on-surface-muted hover:text-on-surface underline underline-offset-[6px] decoration-on-surface-faint"
            >
              See all work →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {related.map((p) => (
              <PaintingCard key={p.slug} painting={p} />
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
