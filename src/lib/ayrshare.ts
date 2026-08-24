// What remains of the Ayrshare integration: the footer's social profile
// list. Posting moved to the platforms' own APIs in src/lib/social-direct.ts
// (see SOCIAL.md); this file can be deleted entirely once the footer is
// hardcoded or the Ayrshare account is fully retired.
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

// Ayrshare sometimes derives profileUrl from the display name (seen with
// Pinterest: "pinterest.com/The Artist Barbara J Demers"). Prefer a URL
// built from the handle where the platform's URL scheme is known, and never
// emit a URL containing whitespace.
const HANDLE_URLS: Record<string, (handle: string) => string> = {
  pinterest: (h) => `https://www.pinterest.com/${h}/`,
  instagram: (h) => `https://www.instagram.com/${h}/`,
  tiktok: (h) => `https://www.tiktok.com/@${h.replace(/^@/, "")}`,
  twitter: (h) => `https://x.com/${h.replace(/^@/, "")}`,
  threads: (h) => `https://www.threads.net/@${h.replace(/^@/, "")}`,
  bluesky: (h) => `https://bsky.app/profile/${h}`,
};

// Known handles that Ayrshare does not report. Its Pinterest entry carries
// neither a username nor a usable profileUrl, so the link is pinned here.
const HANDLE_OVERRIDES: Record<string, string> = {
  pinterest: "barbgbcreations",
};

function profileUrlFor(
  platform: string,
  entry: { username?: string; profileUrl?: string },
): string | null {
  const handle = HANDLE_OVERRIDES[platform] ?? entry.username?.trim();
  const fromUrl = entry.profileUrl?.trim();
  const validUrl = fromUrl && /^https?:\/\/\S+$/.test(fromUrl) ? fromUrl : null;
  const build = HANDLE_URLS[platform];
  if (build && handle && /^@?[\w.-]+$/.test(handle)) {
    // A pinned handle always wins; otherwise only fill in for a bad profileUrl.
    if (HANDLE_OVERRIDES[platform] || !validUrl) return build(handle);
  }
  return validUrl;
}

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
      if (!platform || seen.has(platform)) continue;
      const url = profileUrlFor(platform, entry);
      if (!url) continue;
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
