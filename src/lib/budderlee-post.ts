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
  /** The end of the cutoff day: sign up before this to get firstMailing. */
  signupDeadline: Date;
  signupDeadlineLabel: string;
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
    signupDeadline: zonedTime(cy, cm, cutoffDay + 1, 0),
    signupDeadlineLabel: `${MONTHS[cm - 1]} ${cutoffDay}`,
  };
}

/**
 * The mailing a charge pays for, from the start of the billing period it
 * opens: a period starting on or before the cutoff day pays for next
 * month's package, a later one for the month after. Returned as noon UTC
 * on the 1st, the way Issues store their mailing month, so it reads as
 * the same month in any timezone.
 */
export function mailingPaidFor(cutoffDay: number, periodStart: Date): Date {
  const { year, month, day } = partsIn(POST_TIMEZONE, periodStart);
  const ahead = day <= cutoffDay ? 1 : 2;
  return new Date(Date.UTC(year, month - 1 + ahead, 1, 12));
}

export type PaymentMailing = {
  /** Noon UTC on the 1st of the mailing month, as mailingPaidFor returns. */
  month: Date;
  /** The month bounds in UTC, for querying paidForMailing. */
  from: Date;
  until: Date;
  label: string;
};

/**
 * The mailing whose renewals run this month. Every charge lands between
 * the 1st and the cutoff, and pays for next month's package.
 */
export function currentPaymentMailing(now = new Date()): PaymentMailing {
  const { year, month } = partsIn(POST_TIMEZONE, now);
  // `month` is 1-based, so as a Date.UTC month index it is already next month.
  const from = new Date(Date.UTC(year, month, 1));
  return {
    month: new Date(Date.UTC(year, month, 1, 12)),
    from,
    until: new Date(Date.UTC(year, month + 1, 1)),
    label: `${MONTHS[from.getUTCMonth()]} ${from.getUTCFullYear()}`,
  };
}

/** Today's calendar day in the studio's timezone. */
export function studioDay(now = new Date()): number {
  return partsIn(POST_TIMEZONE, now).day;
}

export type FoundingWindow = {
  /** True while signups still earn the Founding Member iron-on. */
  open: boolean;
  /** The last day that counts, e.g. "October 15". */
  label: string;
};

/**
 * The founding window: anyone who subscribes through the end of the
 * "Founding window ends" day, studio time, is a founding member and gets
 * the Founding Member iron-on. The admin stores that day as a date, so its
 * calendar day is read in UTC.
 */
export function getFoundingWindow(ends?: string, now = new Date()): FoundingWindow | undefined {
  if (!ends) return undefined;
  const d = new Date(ends);
  if (Number.isNaN(d.getTime())) return undefined;
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  return {
    open: now.getTime() < zonedTime(year, month, day + 1, 0).getTime(),
    label: `${MONTHS[month - 1]} ${day}`,
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
