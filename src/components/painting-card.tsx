import Link from "next/link";
import Image from "next/image";
import { AVAILABILITY_STATUS_LABELS } from "@/data/availability";
import type { Painting } from "@/data/paintings";
import { formatPrice } from "@/lib/utils";

export function PaintingCard({ painting }: { painting: Painting }) {
  const isSold = painting.availabilityStatus === "sold" || painting.sold;
  const showPrice = painting.priceDisplay === "visible" && !isSold;
  const showBadge = painting.availabilityStatus !== "available" || painting.sold;

  return (
    <Link
      href={`/gallery/${painting.slug}`}
      className="group block"
    >
      {/* Artwork image container — square corners so the paintings themselves
          set the visual shape, rather than a soft UI frame. */}
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-container shadow-ambient">
        <Image
          src={painting.images[0]}
          alt={painting.title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-[700ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.03]"
        />
        {showBadge && (
          <div className="absolute top-4 right-4 bg-on-surface/90 text-surface text-[11px] tracking-[0.18em] uppercase px-3 py-1.5 rounded-full backdrop-blur-sm">
            {AVAILABILITY_STATUS_LABELS[painting.availabilityStatus]}
          </div>
        )}
      </div>
      <div className="mt-5 flex items-baseline justify-between gap-4">
        <div>
          <h3 className="font-serif text-xl leading-tight text-on-surface">
            {painting.title}
          </h3>
          <p className="text-sm text-on-surface-muted mt-1.5">
            {painting.medium} · {painting.widthIn}×{painting.heightIn} in
          </p>
          <p className="text-sm text-on-surface-subtle mt-2 line-clamp-2">
            {painting.storyTeaser || painting.description}
          </p>
          <p className="mt-3 text-sm font-medium text-primary underline underline-offset-[6px] decoration-primary/30 group-hover:decoration-primary">
            Read the story
          </p>
        </div>
        <p className="font-serif text-xl tabular-nums text-on-surface">
          {showPrice ? formatPrice(painting.priceCents) : "—"}
        </p>
      </div>
    </Link>
  );
}
