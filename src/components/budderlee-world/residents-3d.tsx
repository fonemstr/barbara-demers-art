"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ResidentStage } from "./resident-stage";

// The models (meshopt GLB, ~0.5 MB each) live in Vercel Blob. Upload or
// replace them with scripts/upload-budderlee-world-assets.ts.
const MODEL_BASE = "https://bw2yer8zvkn0tmxl.public.blob.vercel-storage.com/budderlee/world/residents";

const RESIDENTS = [
  { id: "hugo", name: "Hugo", role: "The stationmaster", line: "Pocket watch in paw. The trains in Budderlee run on Hugo's time." },
  { id: "ferdinand", name: "Ferdinand", role: "The gentleman", line: "Bow tie straight and umbrella ready, out for a slow turn around the green." },
  { id: "walter", name: "Walter", role: "The tailor", line: "Never without his tape measure. He'll know your size before you say hello." },
  { id: "clara", name: "Clara", role: "The florist", line: "An armful of marigolds for anyone whose table needs brightening." },
  { id: "maisie", name: "Maisie", role: "The pie maker", line: "Fresh from the oven and still warm. There's always room for pie." },
  { id: "olive", name: "Olive", role: "The fruit seller", line: "Apples from the orchard, picked this morning and polished on her shawl." },
  { id: "henry", name: "Henry", role: "The potter", line: "A pot for every little purpose, thrown by hand on Potter's Row." },
  { id: "arthur", name: "Arthur", role: "The bookseller", line: "Spectacles on and a stack of books under his arm. There's a story for every afternoon." },
  { id: "theodore", name: "Theodore", role: "The gardener", line: "If something leafy is thriving in Budderlee, Theodore had a hand in it." },
];

const modelUrl = (id: string) => `${MODEL_BASE}/${id}.glb`;
const paintingUrl = (id: string) => `/budderlee/world/paintings/${id}.webp`;
const wrap = (i: number) => (i + RESIDENTS.length) % RESIDENTS.length;

type Status = "loading" | "ready" | "error" | "no-webgl";

export function Residents3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<ResidentStage | null>(null);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<Status>("loading");
  const [spinning, setSpinning] = useState(true);
  const resident = RESIDENTS[index];

  // Open on the resident named in the link (#hugo), so a single figure can be shared.
  useEffect(() => {
    const fromHash = RESIDENTS.findIndex((r) => r.id === window.location.hash.slice(1));
    if (fromHash >= 0) setIndex(fromHash);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const probe = document.createElement("canvas");
    if (!probe.getContext("webgl2") && !probe.getContext("webgl")) {
      setStatus("no-webgl");
      return;
    }
    let cancelled = false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) setSpinning(false);
    import("./resident-stage").then(({ createResidentStage }) => {
      if (cancelled) return;
      stageRef.current = createResidentStage(canvas, reduced);
      window.dispatchEvent(new Event("resident-stage-ready"));
    });
    return () => {
      cancelled = true;
      stageRef.current?.dispose();
      stageRef.current = null;
    };
  }, []);

  // Load the figure whenever the selection changes (or the stage arrives).
  useEffect(() => {
    let active = true;
    const load = () => {
      const stage = stageRef.current;
      if (!stage) return;
      setStatus("loading");
      stage
        .show(modelUrl(resident.id))
        .then(() => {
          if (!active) return;
          setStatus("ready");
          stage.preload(modelUrl(RESIDENTS[wrap(index + 1)].id));
          stage.preload(modelUrl(RESIDENTS[wrap(index - 1)].id));
        })
        .catch(() => active && setStatus("error"));
    };
    load();
    window.addEventListener("resident-stage-ready", load);
    try {
      history.replaceState(null, "", `#${resident.id}`);
    } catch {}
    return () => {
      active = false;
      window.removeEventListener("resident-stage-ready", load);
    };
  }, [index, resident.id]);

  useEffect(() => stageRef.current?.setSpinning(spinning), [spinning]);

  const go = useCallback((delta: number) => setIndex((i) => wrap(i + delta)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  return (
    <div className="grid gap-10">
      <div className="grid gap-6 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] items-stretch">
        <div className="relative aspect-square md:aspect-[4/5] max-h-[78vh] w-full rounded-[2rem] overflow-hidden bg-[radial-gradient(ellipse_at_50%_38%,var(--surface-container-lowest)_0%,var(--surface-container)_72%)]">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing touch-none"
            aria-label={`A 3D figure of ${resident.name}. Drag to turn it around.`}
          />
          {status !== "ready" && (
            <p
              role="status"
              className="absolute inset-0 grid place-items-center px-6 text-center font-serif italic text-lg text-on-surface-muted pointer-events-none"
            >
              {status === "loading" && `Bringing ${resident.name} out…`}
              {status === "error" && `${resident.name} didn't load. Try reloading the page.`}
              {status === "no-webgl" && "This browser can't show 3D figures. The paintings are below."}
            </p>
          )}
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[var(--glass-surface)] px-4 py-1.5 text-sm text-on-surface-muted backdrop-blur-xl">
            Drag to turn · Pinch or scroll to zoom
          </p>
        </div>

        <article aria-live="polite" className="flex flex-col gap-6 rounded-[2rem] bg-surface-container-low p-7 md:p-8">
          <div>
            <p className="text-xs tracking-[0.24em] uppercase text-primary font-medium">{resident.role}</p>
            <h2 className="mt-2 font-serif text-4xl md:text-5xl leading-none">{resident.name}</h2>
          </div>
          <p className="text-lg leading-relaxed text-on-surface-muted text-pretty">{resident.line}</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" size="sm" onClick={() => go(-1)}>
              ← Previous
            </Button>
            <Button variant="secondary" size="sm" onClick={() => go(1)}>
              Next →
            </Button>
            <Button variant={spinning ? "primary" : "ghost"} size="sm" aria-pressed={spinning} onClick={() => setSpinning((s) => !s)}>
              {spinning ? "Turning" : "Still"}
            </Button>
          </div>
          <div className="mt-auto flex items-center gap-4">
            <Image
              src={paintingUrl(resident.id)}
              alt={`Barbara's painting of ${resident.name}`}
              width={112}
              height={112}
              className="h-28 w-28 rounded-sm object-cover shadow-ambient"
            />
            <p className="text-sm text-on-surface-muted">
              <span className="block font-medium text-on-surface">The painting</span>
              The original 5×5 inch portrait this figure was sculpted from.
            </p>
          </div>
        </article>
      </div>

      <section aria-labelledby="all-residents" className="grid gap-4">
        <h2 id="all-residents" className="text-xs tracking-[0.24em] uppercase text-on-surface-subtle font-medium">
          All nine residents
        </h2>
        <ul className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-4">
          {RESIDENTS.map((r, i) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-current={i === index}
                className="group grid w-full justify-items-center gap-2 text-center"
              >
                <Image
                  src={paintingUrl(r.id)}
                  alt=""
                  width={160}
                  height={160}
                  className={cn(
                    "aspect-square w-full rounded-sm object-cover outline outline-2 outline-offset-2 transition-transform group-hover:-translate-y-0.5",
                    i === index ? "outline-primary" : "outline-transparent",
                  )}
                />
                <span className={cn("text-sm", i === index ? "text-on-surface font-medium" : "text-on-surface-muted")}>
                  {r.name}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
