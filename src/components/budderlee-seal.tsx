"use client";

import { useEffect, useRef } from "react";

// Budderlee seal intro animation, ported from
// design_handoff_budderlee_seal/budderlee-seal.html (see its README for the
// full spec). The tree, arched title, and motto fade in as cut-out pieces in
// their true seal positions, wind up, spin under motion blur, and resolve
// into the complete seal, which holds. Autoplays once on mount; visitors
// with prefers-reduced-motion see the finished seal immediately.

// The seal artwork is a 1254px square rendered as a 1000px box centered on
// an 1100px stage (breathing room for the spin), scaled to the container.
const STAGE = 1100;
const SL = 50;
const ST = 50;
const SW = 1000;
const F = SW / 1254;

// Cutout offsets within the 1254px seal square (from the handoff spec).
const RECTS = {
  tree: { x: 300, y: 185, w: 654, h: 650 },
  title: { x: 125, y: 44, w: 1003, h: 401 },
  motto: { x: 415, y: 830, w: 440, h: 128 },
  seal: { x: 0, y: 0, w: 1254, h: 1254 },
};

function placement(r: { x: number; y: number; w: number; h: number }) {
  return {
    left: SL + r.x * F,
    top: ST + r.y * F,
    width: r.w * F,
    height: r.h * F,
  };
}

// transform-origin is relative to each ELEMENT's own box, not the stage.
// The group spans the full stage, so the stage center works for it; the
// seal img is inset 50px, so it must use its own center — the design
// reference set the stage center on both, making the seal orbit visibly
// off-axis in the slow tail of the spin.
const GROUP_ORIGIN = `${SL + SW / 2}px ${ST + SW / 2}px`;
const SEAL_ORIGIN = "center";

// Timeline (seconds). Total 13.2s, then holds the finished seal.
const SPIN = 6.5;
const SEAL = 8.7;
const TOTAL = 13.2;

function easeOutCubic(p: number) {
  return 1 - Math.pow(1 - p, 3);
}
function easeInCubic(p: number) {
  return p * p * p;
}
function easeInQuad(p: number) {
  return p * p;
}
function easeInOutSine(p: number) {
  return -(Math.cos(Math.PI * p) - 1) / 2;
}
function anim(
  from: number,
  to: number,
  start: number,
  end: number,
  ease: (p: number) => number,
  t: number,
) {
  if (t <= start) return from;
  if (t >= end) return to;
  return from + (to - from) * ease((t - start) / (end - start));
}

export function BudderleeSeal() {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<HTMLImageElement>(null);
  const titleRef = useRef<HTMLImageElement>(null);
  const mottoRef = useRef<HTMLImageElement>(null);
  const sealRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const group = groupRef.current;
    const tree = treeRef.current;
    const title = titleRef.current;
    const motto = mottoRef.current;
    const seal = sealRef.current;
    if (!root || !stage || !group || !tree || !title || !motto || !seal) return;

    function render(t: number) {
      const treeIn = anim(0, 1, 0.4, 2.2, easeOutCubic, t);
      const titleIn = anim(0, 1, 2.3, 4.0, easeOutCubic, t);
      const mottoIn = anim(0, 1, 4.1, 5.6, easeOutCubic, t);
      const windup = anim(1, 0.955, SPIN - 0.45, SPIN, easeInOutSine, t);
      const r1 = anim(0, 1080, SPIN, SPIN + 2.0, easeInCubic, t);
      const piecesOut = anim(1, 0, SPIN + 1.1, SPIN + 1.6, easeInOutSine, t);
      const sealIn = anim(0, 1, SPIN + 1.1, SPIN + 1.6, easeInOutSine, t);
      const r2 = anim(1080, 1800, SPIN + 1.4, SEAL + 2.0, easeOutCubic, t);
      const sealScale = anim(0.8, 1, SPIN + 1.4, SEAL + 1.5, easeOutCubic, t);
      const blur =
        anim(0, 6, SPIN + 0.6, SPIN + 1.2, easeInQuad, t) *
        anim(1, 0, SPIN + 1.5, SEAL + 0.8, easeOutCubic, t);

      tree!.style.opacity = String(treeIn);
      tree!.style.transform = `translateY(${24 * (1 - treeIn)}px)`;
      title!.style.opacity = String(titleIn);
      title!.style.transform = `translateY(${-26 * (1 - titleIn)}px)`;
      motto!.style.opacity = String(mottoIn);
      motto!.style.transform = `translateY(${18 * (1 - mottoIn)}px)`;
      group!.style.opacity = String(piecesOut);
      group!.style.transform = `rotate(${r1}deg) scale(${windup})`;
      group!.style.filter = blur > 0.05 ? `blur(${blur}px)` : "none";
      seal!.style.opacity = String(sealIn);
      seal!.style.transform = `rotate(${r2}deg) scale(${sealScale})`;
      seal!.style.filter = blur > 0.05 ? `blur(${blur}px)` : "none";
    }

    // Test hook, same as the design reference: render an arbitrary timestamp.
    (window as { __budderleeRender?: (t: number) => void }).__budderleeRender =
      render;

    const fit = () => {
      stage.style.transform = `scale(${root.clientWidth / STAGE})`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(root);

    // Reduced motion: show the finished seal immediately.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      render(TOTAL);
      return () => ro.disconnect();
    }

    // Autoplay once, then hold the final frame. Time accumulates only while
    // frames are painted, so a hidden tab pauses the intro instead of
    // finishing it unseen.
    let elapsed = 0;
    let last: number | null = null;
    let raf = 0;
    const tick = (now: number) => {
      if (last !== null) elapsed += (now - last) / 1000;
      last = now;
      render(Math.min(elapsed, TOTAL));
      if (elapsed < TOTAL) raf = requestAnimationFrame(tick);
    };
    const onVisibility = () => {
      last = null;
    };
    document.addEventListener("visibilitychange", onVisibility);
    render(0);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      ro.disconnect();
    };
  }, []);

  // Pieces and seal start invisible; the effect drives every frame. The
  // seal asset is circle-masked to transparency outside its rim, so it sits
  // on any background without a white square showing during the spin.
  /* eslint-disable @next/next/no-img-element */
  return (
    <div
      ref={rootRef}
      role="img"
      aria-label="Budderlee village seal — a village where every resident matters, rooted in kindness"
      className="relative aspect-square w-full overflow-hidden"
    >
      <div
        ref={stageRef}
        className="absolute left-0 top-0 origin-top-left"
        style={{ width: STAGE, height: STAGE }}
      >
        <div
          ref={groupRef}
          className="absolute inset-0"
          style={{ transformOrigin: GROUP_ORIGIN, opacity: 0 }}
        >
          <img
            ref={treeRef}
            src="/budderlee/anim/piece-tree.webp"
            alt=""
            className="absolute select-none"
            style={{ ...placement(RECTS.tree), opacity: 0 }}
          />
          <img
            ref={titleRef}
            src="/budderlee/anim/piece-title.webp"
            alt=""
            className="absolute select-none"
            style={{ ...placement(RECTS.title), opacity: 0 }}
          />
          <img
            ref={mottoRef}
            src="/budderlee/anim/piece-motto.webp"
            alt=""
            className="absolute select-none"
            style={{ ...placement(RECTS.motto), opacity: 0 }}
          />
        </div>
        <img
          ref={sealRef}
          src="/budderlee/anim/seal.webp"
          alt=""
          className="absolute select-none"
          style={{
            ...placement(RECTS.seal),
            transformOrigin: SEAL_ORIGIN,
            opacity: 0,
          }}
        />
      </div>
      <noscript>
        <img
          src="/budderlee/anim/seal.webp"
          alt=""
          className="absolute inset-0 h-full w-full"
          style={{ padding: `${(SL / STAGE) * 100}%` }}
        />
      </noscript>
    </div>
  );
}
