"use client";

import { useState } from "react";
import Image from "next/image";

// Main image + clickable detail thumbnails. The box keeps the painting's
// real aspect ratio; detail shots (often tighter crops) are letterboxed
// inside it rather than cropped, so brushwork close-ups stay whole.
export function PaintingGallery({
  title,
  images,
  widthIn,
  heightIn,
}: {
  title: string;
  images: string[];
  widthIn: number;
  heightIn: number;
}) {
  const [selected, setSelected] = useState(0);
  const current = images[selected] ?? images[0];

  return (
    <>
      <div
        className="relative z-[1] overflow-hidden shadow-lifted bg-surface-container-lowest"
        style={{ aspectRatio: `${widthIn} / ${heightIn}` }}
      >
        <Image
          key={current}
          src={current}
          alt={
            selected === 0 ? title : `${title} — detail ${selected}`
          }
          fill
          sizes="(min-width: 768px) 60vw, 100vw"
          className={selected === 0 ? "object-cover" : "object-contain"}
          priority
        />
      </div>
      {images.length > 1 && (
        <div className="relative z-[1] mt-6">
          <p className="text-xs uppercase tracking-[0.18em] text-on-surface-subtle">
            Look closer
          </p>
          <div className="mt-3 grid grid-cols-4 gap-3">
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
                  sizes="15vw"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
