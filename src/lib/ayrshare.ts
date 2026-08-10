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
