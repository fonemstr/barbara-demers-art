import { SITE_URL } from "@/lib/site-url";

// Ayrshare fans one API call out to every connected social account.
// Barbara links her Instagram/Facebook/X/Pinterest accounts once in the
// Ayrshare dashboard; AYRSHARE_API_KEY in the environment does the rest.
// Without the key, posting reports a clear failure instead of crashing —
// the same graceful-degradation pattern as Stripe and Resend.

const API_URL = "https://api.ayrshare.com/api/post";

export type SocialPlatform = "instagram" | "facebook" | "twitter" | "pinterest";

export const SOCIAL_PLATFORM_OPTIONS: { label: string; value: SocialPlatform }[] = [
  { label: "Instagram", value: "instagram" },
  { label: "Facebook", value: "facebook" },
  { label: "X (Twitter)", value: "twitter" },
  { label: "Pinterest", value: "pinterest" },
];

export type SocialPostResult = {
  ok: boolean;
  summary: string;
};

/** Media URLs sent to Ayrshare must be absolute and publicly reachable. */
export function absoluteMediaUrl(url: string): string {
  return url.startsWith("http") ? url : `${SITE_URL}${url}`;
}

export async function sendSocialPost({
  post,
  platforms,
  mediaUrls,
  scheduleAt,
  pinterestOptions,
}: {
  post: string;
  platforms: SocialPlatform[];
  mediaUrls?: string[];
  scheduleAt?: string | null;
  /** Pins are links first — set the destination and title when posting to Pinterest. */
  pinterestOptions?: { link?: string; title?: string };
}): Promise<SocialPostResult> {
  const apiKey = process.env.AYRSHARE_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      summary: "AYRSHARE_API_KEY is not set — post was not sent.",
    };
  }
  if (!platforms.length) {
    return { ok: false, summary: "No platforms selected — post was not sent." };
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        post,
        platforms,
        ...(mediaUrls?.length
          ? { mediaUrls: mediaUrls.map(absoluteMediaUrl) }
          : {}),
        ...(scheduleAt ? { scheduleDate: new Date(scheduleAt).toISOString() } : {}),
        ...(pinterestOptions && platforms.includes("pinterest")
          ? { pinterestOptions }
          : {}),
      }),
    });
    const body = (await res.json().catch(() => ({}))) as {
      status?: string;
      errors?: unknown[];
      postIds?: { platform?: string; status?: string }[];
    };

    const ok = res.ok && body.status !== "error";
    const perPlatform = (body.postIds ?? [])
      .map((p) => `${p.platform ?? "?"}: ${p.status ?? "?"}`)
      .join(", ");
    const summary = ok
      ? `Sent${scheduleAt ? " (scheduled)" : ""}. ${perPlatform || "Accepted by Ayrshare."}`
      : `Ayrshare error (HTTP ${res.status}): ${JSON.stringify(body.errors ?? body).slice(0, 600)}`;
    return { ok, summary };
  } catch (err) {
    return {
      ok: false,
      summary: `Request failed: ${err instanceof Error ? err.message : "unknown error"}`,
    };
  }
}

// ---------------------------------------------------------------------------
// Linked profiles — used for the footer's social links.
// GET /api/user lists every account connected in the Ayrshare dashboard
// along with its public profile URL, so the footer stays in sync without a
// hardcoded list. Cached for a day; a failed or keyless request yields an
// empty list and the footer simply omits the row.

const USER_URL = "https://api.ayrshare.com/api/user";

export type SocialProfile = {
  platform: string;
  displayName: string;
  url: string;
};

export async function getSocialProfiles(): Promise<SocialProfile[]> {
  const apiKey = process.env.AYRSHARE_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(USER_URL, {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    const body = (await res.json()) as {
      displayNames?: {
        platform?: string;
        displayName?: string;
        username?: string;
        profileUrl?: string;
      }[];
    };

    const seen = new Set<string>();
    const profiles: SocialProfile[] = [];
    for (const entry of body.displayNames ?? []) {
      const platform = entry.platform?.toLowerCase();
      const url = entry.profileUrl;
      if (!platform || !url || !/^https?:\/\//.test(url) || seen.has(platform)) continue;
      seen.add(platform);
      profiles.push({
        platform,
        displayName: entry.displayName || entry.username || platform,
        url,
      });
    }
    return profiles;
  } catch {
    return [];
  }
}
