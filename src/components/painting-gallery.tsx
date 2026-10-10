"use client";

import { useState } from "react";
import Image from "next/image";

// Main image + clickable detail thumbnails. The box keeps the painting's
// real aspect ratio; detail shots (often tighter crops) are letterboxed
// inside it rather than cropped, so brushwork close-ups stay whole.
// Photos Barbara tagged as themed scenes (the painting staged with a frame
// and props) carry a "Themed scene" tag and a caption saying so.
export function PaintingGallery({
  title,
  images,
  widthIn,
  heightIn,
  themedIndexes = [],
}: {
  title: string;
  images: string[];
  widthIn: number;
  heightIn: number;
  themedIndexes?: number[];
}) {
  const [selected, setSelected] = useState(0);
  const current = images[selected] ?? images[0];
  const themed = themedIndexes.includes(selected);

  return (
    // Thumbnails sit in a vertical strip left of the painting on desktop
    // and drop to a row underneath on phones.
    <div className="relative z-[1] flex flex-col-reverse gap-4 md:flex-row md:items-start">
      {images.length > 1 && (
        <div className="md:w-20 md:shrink-0">
          <p className="text-xs uppercase tracking-[0.18em] text-on-surface-subtle md:sr-only">
            Look closer
          </p>
          <div className="mt-3 grid grid-cols-4 gap-3 md:mt-0 md:grid-cols-1">
            {images.map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => setSelected(i)}
                aria-label={
                  i === 0 ? "View full painting" : `View detail ${i}`
                }
                aria-pressed={i === selected}
                className={`relative aspect-square overflow-hidden bg-surface-container cursor-pointer transition-opacity ${
                  i === selected
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-surface"
                    : "opacity-80 hover:opacity-100"
                }`}
              >
                <Image
                  src={src}
                  alt={`${title} — ${i === 0 ? "full painting" : `detail ${i}`}`}
                  fill
                  sizes="(min-width: 768px) 80px, 25vw"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
      <figure className="min-w-0 flex-1">
        <div
          className="relative overflow-hidden shadow-lifted bg-surface-container-lowest"
          style={{ aspectRatio: `${widthIn} / ${heightIn}` }}
        >
          <Image
            key={current}
            src={current}
            alt={
              selected === 0 ? title : `${title} — detail ${selected}`
            }
            fill
            sizes="(min-width: 1152px) 600px, (min-width: 768px) 55vw, 100vw"
            className={selected === 0 ? "object-cover" : "object-contain"}
            priority
            fetchPriority="high"
          />
          {themed && (
            <span className="absolute left-3 top-3 rounded-full bg-on-surface/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-surface">
              Themed scene
            </span>
          )}
        </div>
        {themed && (
          <figcaption className="mt-3 text-sm italic text-on-surface-subtle">
            Photo shows this painting in a themed scene. The frame and setting are
            for display only.
          </figcaption>
        )}
      </figure>
    </div>
  );
}
