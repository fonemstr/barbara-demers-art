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
  collectTax: boolean;
  includePastDue: boolean;
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
  collectTax: false,
  includePastDue: true,
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
      collectTax: g.collectTax ?? false,
      includePastDue: g.includePastDue ?? true,
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

// Barbara's studio is in North Carolina; the cutoff is a calendar day there.
export const POST_TIMEZONE = "America/New_York";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function partsIn(zone: string, d: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    year: "numeric", month: "numeric", day: "numeric",
    hour: "numeric", minute: "numeric", second: "numeric", hour12: false,
  }).formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour") % 24, minute: get("minute"), second: get("second") };
}

/** The instant of a wall-clock time in the studio's timezone. */
export function zonedTime(year: number, month: number, day: number, hour = 9): Date {
  const guess = Date.UTC(year, month - 1, day, hour);
  const p = partsIn(POST_TIMEZONE, new Date(guess));
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return new Date(guess - (asUtc - guess));
}

export type SignupSchedule = {
  /** True when the signup lands on or before the cutoff: charged now. */
  chargesNow: boolean;
  /** When the first $12 is charged: now, or 9am on the next cutoff day. */
  chargeDate: Date;
  chargeDateLabel: string;
  /** First day of the month the first package mails in. */
  firstMailing: Date;
  firstMailingLabel: string;
};

/**
 * Where a signup lands relative to the cutoff. On or before the cutoff
 * day the card is charged now and the next mailing is theirs; after it,
 * nothing is charged until the next cutoff and the first package is the
 * mailing after that.
 */
export function getSignupSchedule(cutoffDay: number, now = new Date()): SignupSchedule {
  const { year, month, day } = partsIn(POST_TIMEZONE, now);
  const chargesNow = day <= cutoffDay;
  let cy = year;
  let cm = month;
  if (!chargesNow) {
    cm += 1;
    if (cm > 12) { cm = 1; cy += 1; }
  }
  let my = cy;
  let mm = cm + 1;
  if (mm > 12) { mm = 1; my += 1; }
  const cutoff = zonedTime(cy, cm, cutoffDay, 9);
  return {
    chargesNow,
    chargeDate: chargesNow ? now : cutoff,
    chargeDateLabel: chargesNow ? "today" : `${MONTHS[cm - 1]} ${cutoffDay}`,
    firstMailing: zonedTime(my, mm, 1, 0),
    firstMailingLabel: `${MONTHS[mm - 1]} ${my}`,
  };
}

/** Subscribers who count against the cap: anyone Stripe still bills. */
export async function getActiveSubscriberCount(): Promise<number> {
  const payload = await getPayloadClient();
  if (!payload) return 0;
  try {
    const res = await payload.count({
      collection: "subscribers",
      where: { status: { in: ["active", "trialing", "past_due"] } },
      overrideAccess: true,
    });
    return res.totalDocs;
  } catch (err) {
    console.error("[budderlee-post] subscriber count failed:", err);
    return 0;
  }
}
