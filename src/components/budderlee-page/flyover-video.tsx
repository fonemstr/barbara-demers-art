"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import s from "./budderlee-page.module.css";

// The village dive clip from the flyover, looping silently behind the
// "Fly over Budderlee" band. The 8 MB clip only loads once the band is
// near the screen; the still sits underneath so the band is never blank
// while it loads, and is all that shows for reduced motion.
const CLIP =
  "https://bw2yer8zvkn0tmxl.public.blob.vercel-storage.com/budderlee/world/vid/village.mp4";
const STILL = "/budderlee/world/village.webp";

export function FlyoverVideo() {
  const box = useRef<HTMLDivElement>(null);
  const [play, setPlay] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setPlay(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );
    if (box.current) io.observe(box.current);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={box} className={s.flyMedia} aria-hidden="true">
      <Image src={STILL} alt="" fill sizes="100vw" />
      {play && (
        <video
          // React sets muted as a property after mount, too late for
          // autoplay; muting and starting it here is what browsers accept.
          ref={(v) => {
            if (!v) return;
            v.muted = true;
            v.play().catch(() => {});
          }}
          src={CLIP}
          poster={STILL}
          muted
          loop
          playsInline
        />
      )}
    </div>
  );
}
