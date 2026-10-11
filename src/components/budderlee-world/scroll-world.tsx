"use client";

import { useEffect, useRef } from "react";
import { mountScrollWorld } from "./scrub-engine";
import { VILLAGE_SECTIONS as SECTIONS } from "./sections";

// A scroll-scrubbed flight through Budderlee, built with the scroll-world
// pipeline: six clay-diorama scenes (Higgsfield stills), a camera "dive" clip
// into each, and connector clips that fly from one scene to the next. Scroll
// drives the video time; the engine does the rest.

const ASSETS = "/budderlee/world";
// The clips (~75 MB) live in Vercel Blob, not git. Upload or replace them with
// scripts/upload-budderlee-world-assets.ts.
const BUDDERLEE_WORLD_VIDEO_BASE =
  "https://bw2yer8zvkn0tmxl.public.blob.vercel-storage.com/budderlee/world/vid";
const still = (id: string) => `${ASSETS}/${id}.webp`;
const clip = (id: string) => `${BUDDERLEE_WORLD_VIDEO_BASE}/${id}.mp4`;


// Connector i flies from scene i to scene i+1. A null slot crossfades instead.
const CONNECTORS = [1, 2, 3, 4, 5].map((i) => clip(`conn${i}`));

export function ScrollWorld() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    return mountScrollWorld(container, {
      nav: false,
      hint: "Scroll to fly in",
      diveScroll: 1.3,
      connScroll: 0.9,
      sections: SECTIONS.map((s) => ({ ...s, still: still(s.id), clip: clip(s.id) })),
      connectors: CONNECTORS,
    });
  }, []);

  return (
    <div ref={ref} className="budderlee-world">
      {/* Before the engine mounts (and for crawlers), the approved village. */}
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={still("village")} alt="The village of Budderlee as a little clay diorama" />
      </noscript>
    </div>
  );
}
