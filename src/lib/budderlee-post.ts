import { getPayloadClient } from "./payload";

// The Budderlee Post: a monthly story-and-art subscription by mail.
// Copy that never changes lives here; the knobs Barbara adjusts live in
// the "budderlee-post" global and are read through getBudderleePostSettings.
export const BUDDERLEE_POST = {
  name: "The Budderlee Post",
  tagline: "A monthly story-and-art subscription by mail",
  statementDescriptor: "BUDDERLEE POST",
} as const;

export type PostPhase = "waitlist" | "open" | "closed";

export type PostResident = {
  name: string;
  role?: string;
  number?: number;
  slug: string;
  imageUrl?: string;
};

export type PostSettings = {
  phase: PostPhase;
  nextMailing: string;
  subscriberCap: number;
  cutoffDay: number;
  priceCents: number;
  foundingWindowEnds?: string;
  stripePriceId?: string;
  firstResident?: PostResident;
};

// Matches the defaults on the global so the page renders sensibly before
// Barbara has saved the settings once, and in dev without a database.
export const DEFAULT_POST_SETTINGS: PostSettings = {
  phase: "waitlist",
  nextMailing: "November 2026",
  subscriberCap: 100,
  cutoffDay: 15,
  priceCents: 1200,
  foundingWindowEnds: "2026-10-15T00:00:00.000Z",
};

type ResidentDoc = {
  slug?: string | null;
  title?: string | null;
  characterName?: string | null;
  characterRole?: string | null;
  profile?: { residentNumber?: number | null } | null;
  images?: Array<{ image?: number | { url?: string | null } | null }> | null;
};

function toResident(doc: unknown): PostResident | undefined {
  if (!doc || typeof doc !== "object") return undefined;
  const d = doc as ResidentDoc;
  if (!d.slug) return undefined;
  const first = d.images?.[0]?.image;
  const imageUrl =
    first && typeof first === "object" && first.url ? first.url : undefined;
  return {
    name: d.characterName || d.title || d.slug,
    role: d.characterRole ?? undefined,
    number: d.profile?.residentNumber ?? undefined,
    slug: d.slug,
    imageUrl,
  };
}

export async function getBudderleePostSettings(): Promise<PostSettings> {
  const payload = await getPayloadClient();
  if (!payload) return DEFAULT_POST_SETTINGS;
  try {
    const g = await payload.findGlobal({ slug: "budderlee-post", depth: 1 });
    return {
      phase: (g.phase as PostPhase) ?? DEFAULT_POST_SETTINGS.phase,
      nextMailing: g.nextMailing || DEFAULT_POST_SETTINGS.nextMailing,
      subscriberCap: g.subscriberCap ?? DEFAULT_POST_SETTINGS.subscriberCap,
      cutoffDay: g.cutoffDay ?? DEFAULT_POST_SETTINGS.cutoffDay,
      priceCents: g.priceCents ?? DEFAULT_POST_SETTINGS.priceCents,
      foundingWindowEnds:
        g.foundingWindowEnds ?? DEFAULT_POST_SETTINGS.foundingWindowEnds,
      stripePriceId: g.stripePriceId ?? undefined,
      firstResident: toResident(g.firstResident),
    };
  } catch (err) {
    console.error("[budderlee-post] settings unavailable, using defaults:", err);
    return DEFAULT_POST_SETTINGS;
  }
}

export function formatDollars(cents: number): string {
  return cents % 100 === 0
    ? `$${cents / 100}`
    : `$${(cents / 100).toFixed(2)}`;
}
