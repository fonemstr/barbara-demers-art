import Link from "next/link";
import Image from "next/image";
import { Painting } from "@/data/paintings";
import { formatPrice } from "@/lib/utils";

export function PaintingCard({ painting }: { painting: Painting }) {
  return (
    <Link
      href={`/gallery/${painting.slug}`}
      className="group block"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        <Image
          src={painting.images[0]}
          alt={painting.title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
        />
        {painting.sold && (
          <div className="absolute top-4 right-4 bg-foreground/90 text-background text-xs tracking-widest uppercase px-3 py-1.5 rounded-full">
            Sold
          </div>
        )}
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <div>
          <h3 className="font-serif text-lg leading-tight">{painting.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {painting.medium} · {painting.widthIn}×{painting.heightIn} in
          </p>
        </div>
        <p className="font-serif text-lg tabular-nums">
          {painting.sold ? "—" : formatPrice(painting.priceCents)}
        </p>
      </div>
    </Link>
  );
}
