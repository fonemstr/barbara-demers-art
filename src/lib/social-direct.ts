import { SITE_URL } from "@/lib/site-url";

// Direct social posting — replaces Ayrshare ($149/mo) with the platforms'
// own free APIs. One Meta app covers the Facebook Page and the linked
// Instagram Business account; Pinterest posts through its v5 API using a
// refresh token exchanged at send time (access tokens expire, refresh
// tokens last ~a year). Missing configuration degrades to a clear per-
// platform failure message, never a crash — the same pattern as Stripe,
// Resend, and the old Ayrshare client. Setup steps live in SOCIAL.md.

const GRAPH = "https://graph.facebook.com/v23.0";
const PINTEREST = "https://api.pinterest.com/v5";

export type SocialPlatform = "instagram" | "facebook" | "pinterest";

export const SOCIAL_PLATFORM_OPTIONS: { label: string; value: SocialPlatform }[] = [
  { label: "Instagram", value: "instagram" },
  { label: "Facebook", value: "facebook" },
  { label: "Pinterest", value: "pinterest" },
];

export type SocialPostResult = {
  ok: boolean;
  summary: string;
};

/** Media URLs sent to the platforms must be absolute and publicly reachable. */
export function absoluteMediaUrl(url: string): string {
  return url.startsWith("http") ? url : `${SITE_URL}${url}`;
}

type GraphError = { error?: { message?: string; code?: number } };

async function graphJson(res: Response): Promise<Record<string, unknown> & GraphError> {
  return (await res.json().catch(() => ({}))) as Record<string, unknown> & GraphError;
}

function fail(platform: string, detail: string): string {
  return `${platform}: FAILED (${detail.slice(0, 300)})`;
}

// --- Facebook Page ---------------------------------------------------------

async function postToFacebook(post: string, imageUrl?: string): Promise<string> {
  const pageId = process.env.META_PAGE_ID;
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!pageId || !token) return fail("facebook", "META_PAGE_ID / META_PAGE_ACCESS_TOKEN not set");

  const endpoint = imageUrl ? `${GRAPH}/${pageId}/photos` : `${GRAPH}/${pageId}/feed`;
  const body = new URLSearchParams(
    imageUrl ? { url: imageUrl, caption: post } : { message: post },
  );
  body.set("access_token", token);

  const res = await fetch(endpoint, { method: "POST", body });
  const json = await graphJson(res);
  if (!res.ok || json.error) {
    return fail("facebook", json.error?.message ?? `HTTP ${res.status}`);
  }
  return "facebook: posted";
}

// --- Instagram -------------------------------------------------------------

async function postToInstagram(post: string, imageUrl?: string): Promise<string> {
  const igId = process.env.META_IG_USER_ID;
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!igId || !token) return fail("instagram", "META_IG_USER_ID / META_PAGE_ACCESS_TOKEN not set");
  if (!imageUrl) return fail("instagram", "Instagram requires an image");

  // 1. Create a media container.
  const createBody = new URLSearchParams({
    image_url: imageUrl,
    caption: post,
    access_token: token,
  });
  const createRes = await fetch(`${GRAPH}/${igId}/media`, { method: "POST", body: createBody });
  const created = await graphJson(createRes);
  const creationId = typeof created.id === "string" ? created.id : null;
  if (!createRes.ok || created.error || !creationId) {
    return fail("instagram", created.error?.message ?? `container HTTP ${createRes.status}`);
  }

  // 2. Wait for the container to finish processing (usually immediate for images).
  for (let i = 0; i < 5; i++) {
    const statusRes = await fetch(
      `${GRAPH}/${creationId}?fields=status_code&access_token=${encodeURIComponent(token)}`,
    );
    const status = await graphJson(statusRes);
    if (status.status_code === "FINISHED") break;
    if (status.status_code === "ERROR") return fail("instagram", "container processing failed");
    await new Promise((r) => setTimeout(r, 3000));
  }

  // 3. Publish.
  const publishBody = new URLSearchParams({ creation_id: creationId, access_token: token });
  const publishRes = await fetch(`${GRAPH}/${igId}/media_publish`, {
    method: "POST",
    body: publishBody,
  });
  const published = await graphJson(publishRes);
  if (!publishRes.ok || published.error) {
    return fail("instagram", published.error?.message ?? `publish HTTP ${publishRes.status}`);
  }
  return "instagram: posted";
}

// --- Pinterest -------------------------------------------------------------

async function pinterestAccessToken(): Promise<{ token?: string; error?: string }> {
  const appId = process.env.PINTEREST_APP_ID;
  const secret = process.env.PINTEREST_APP_SECRET;
  const refresh = process.env.PINTEREST_REFRESH_TOKEN;
  if (!appId || !secret || !refresh) {
    return { error: "PINTEREST_APP_ID / PINTEREST_APP_SECRET / PINTEREST_REFRESH_TOKEN not set" };
  }
  const res = await fetch(`${PINTEREST}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${appId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refresh }),
  });
  const json = (await res.json().catch(() => ({}))) as { access_token?: string; message?: string };
  if (!res.ok || !json.access_token) {
    return { error: `token refresh failed: ${json.message ?? `HTTP ${res.status}`}` };
  }
  return { token: json.access_token };
}

async function postToPinterest(
  post: string,
  imageUrl?: string,
  options?: { link?: string; title?: string },
): Promise<string> {
  const boardId = process.env.PINTEREST_BOARD_ID;
  if (!boardId) return fail("pinterest", "PINTEREST_BOARD_ID not set");
  if (!imageUrl) return fail("pinterest", "Pinterest requires an image");

  const { token, error } = await pinterestAccessToken();
  if (!token) return fail("pinterest", error ?? "no access token");

  const res = await fetch(`${PINTEREST}/pins`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      board_id: boardId,
      description: post.slice(0, 800),
      title: options?.title,
      link: options?.link ?? SITE_URL,
      media_source: { source_type: "image_url", url: imageUrl },
    }),
  });
  const json = (await res.json().catch(() => ({}))) as { message?: string };
  if (!res.ok) return fail("pinterest", json.message ?? `HTTP ${res.status}`);
  return "pinterest: posted";
}

// --- Fan-out ---------------------------------------------------------------

export async function sendSocialPost({
  post,
  platforms,
  mediaUrls,
  pinterestOptions,
}: {
  post: string;
  platforms: SocialPlatform[];
  mediaUrls?: string[];
  /** Pins are links first — set the destination and title when posting to Pinterest. */
  pinterestOptions?: { link?: string; title?: string };
}): Promise<SocialPostResult> {
  if (!platforms.length) {
    return { ok: false, summary: "No platforms selected — post was not sent." };
  }
  const imageUrl = mediaUrls?.length ? absoluteMediaUrl(mediaUrls[0]) : undefined;

  const tasks = platforms.map((p) => {
    const run =
      p === "facebook"
        ? postToFacebook(post, imageUrl)
        : p === "instagram"
          ? postToInstagram(post, imageUrl)
          : postToPinterest(post, imageUrl, pinterestOptions);
    return run.catch((err: unknown) =>
      fail(p, err instanceof Error ? err.message : "unknown error"),
    );
  });

  const summaries = await Promise.all(tasks);
  const ok = summaries.every((s) => !s.includes("FAILED"));
  return { ok, summary: summaries.join(" | ") };
}
