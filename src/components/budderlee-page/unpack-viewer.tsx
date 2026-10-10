"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import s from "./budderlee-page.module.css";

export type UnpackStep = {
  kicker: string;
  title: string;
  body: string;
  badge?: string;
  /** The item's outline in the photo, as fractions [x0, y0, x1, y1]. */
  box: [number, number, number, number];
};

const PHOTO = { src: "/budderlee/post/walter-month-flat-lay.webp", width: 1678, height: 1376 };
const MARGIN = 48;

// Scrolling through the steps zooms Walter's month onto each item in turn.
// Each step frames its item's outline so nothing is ever cropped, whatever
// the viewer's size.
export function UnpackViewer({ steps }: { steps: UnpackStep[] }) {
  const viewer = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);

  const frame = useCallback(
    (index: number, instant = false) => {
      const v = viewer.current;
      const el = img.current;
      if (!v || !el) return;
      const [x0, y0, x1, y1] = steps[index].box;
      const w = v.clientWidth;
      const h = v.clientHeight;
      const ratio = PHOTO.width / PHOTO.height;
      const iw = Math.min(w - MARGIN, (h - MARGIN) * ratio);
      const ih = iw / ratio;
      el.style.width = `${iw}px`;
      el.style.height = `${ih}px`;
      const scale = Math.min((w - MARGIN) / ((x1 - x0) * iw), (h - MARGIN) / ((y1 - y0) * ih), 3.2);
      const tx = w / 2 - (scale * (x0 + x1) * iw) / 2;
      const ty = h / 2 - (scale * (y0 + y1) * ih) / 2;
      if (instant) el.style.transition = "none";
      el.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
      if (instant) {
        void el.offsetWidth;
        el.style.transition = "";
      }
    },
    [steps],
  );

  useEffect(() => {
    activeRef.current = active;
    frame(active);
  }, [active, frame]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(stepRefs.current.indexOf(e.target as HTMLDivElement));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    stepRefs.current.forEach((el) => el && io.observe(el));
    const onResize = () => frame(activeRef.current, true);
    window.addEventListener("resize", onResize);
    return () => {
      io.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [frame]);

  return (
    <div className="grid gap-14 md:grid-cols-[1.25fr_0.75fr]">
      <div ref={viewer} className={s.viewer}>
        {/* A plain img: it is sized and transformed by hand above. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={img}
          src={PHOTO.src}
          width={PHOTO.width}
          height={PHOTO.height}
          alt="Everything in Walter's month of The Budderlee Post, laid out together"
          loading="lazy"
          onLoad={() => frame(activeRef.current, true)}
        />
        <div className={s.viewerCount} aria-hidden="true">
          {active + 1} of {steps.length}
        </div>
      </div>
      <div>
        {steps.map((step, i) => (
          <div
            key={step.title}
            ref={(el) => {
              stepRefs.current[i] = el;
            }}
            className={`${s.step} ${i === active ? s.stepOn : ""}`}
          >
            <p className="font-serif italic text-lg text-primary">{step.kicker}</p>
            <h3 className="mt-2 mb-3 font-serif text-3xl leading-tight text-on-surface">{step.title}</h3>
            <p className="text-[17px] leading-relaxed text-on-surface-muted">{step.body}</p>
            {step.badge && (
              <span className="mt-4 inline-block self-start rounded-full bg-secondary-container px-3 py-1.5 text-xs font-semibold tracking-wide text-on-secondary-container">
                {step.badge}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
