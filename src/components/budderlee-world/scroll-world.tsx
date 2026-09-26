"use client";

import { useEffect, useRef } from "react";
import { mountScrollWorld } from "./scrub-engine";

// A scroll-scrubbed flight through Budderlee, built with the scroll-world
// pipeline: six clay-diorama scenes (Higgsfield stills), a camera "dive" clip
// into each, and connector clips that fly from one scene to the next. Scroll
// drives the video time; the engine does the rest.

const ASSETS = "/budderlee/world";
const still = (id: string) => `${ASSETS}/${id}.webp`;
const clip = (id: string) => `${ASSETS}/vid/${id}.mp4`;

const SECTIONS = [
  {
    id: "village",
    label: "The village",
    accent: "#6f7a3c",
    eyebrow: "The village of Budderlee",
    title: "Welcome to Budderlee",
    body: "A little village rooted in kindness, somewhere past the last fence post. Scroll to wander in.",
    scroll: 1.5,
    linger: 0.35,
  },
  {
    id: "green",
    label: "The green",
    accent: "#5f7043",
    eyebrow: "The village green",
    title: "Under the Budderlee Tree",
    body: "Sooner or later everyone ends up here. Ferdinand takes his slow turn, Arthur reads on the bench and Theodore minds the flower beds.",
    tags: ["Ferdinand", "Arthur", "Theodore"],
  },
  {
    id: "market",
    label: "Market Street",
    accent: "#9a4a2c",
    eyebrow: "Market Street",
    title: "Open for business",
    body: "Walter has his tape measure out, Clara's flowers are fresh and Maisie's pies are still warm.",
    tags: ["Walter", "Clara", "Maisie"],
  },
  {
    id: "station",
    label: "Hugo's Station",
    accent: "#4f6378",
    eyebrow: "By the creek",
    title: "Right on time",
    body: "Hugo checks his pocket watch as the little train pulls in beside the old water mill.",
    tags: ["Hugo"],
  },
  {
    id: "orchard",
    label: "The orchard",
    accent: "#8a5a2b",
    eyebrow: "Past the fence",
    title: "Apples in every basket",
    body: "Olive picks the orchard's best every morning and polishes them on her shawl.",
    tags: ["Olive"],
  },
  {
    id: "potters",
    label: "Potter's Row",
    accent: "#845e00",
    eyebrow: "One small painting at a time",
    title: "The village is still growing",
    body: "Like every neighbour here, Henry began as an original 5×5 inch painting by Barbara. New residents are moving in all the time.",
    tags: ["Henry"],
    scroll: 1.6,
    linger: 0.3,
    cta: {
      primary: { label: "Meet the residents", href: "/budderlee" },
      secondary: { label: "The Budderlee Post", href: "/budderlee/post" },
    },
  },
];

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
