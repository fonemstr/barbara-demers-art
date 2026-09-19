import {
  absoluteMediaUrl,
  sendSocialPost,
  type SocialPlatform,
  type SocialPostResult,
} from "./social-direct";
import { instagramSafeImageUrl } from "./instagram-image";

// One delivery path for every kind of post: the painting auto-announce, the
// Social Posts composer, and the scheduler. Instagram only accepts feed
// images between 4:5 and 1.91:1, and Barbara's canvases are often taller or
// wider than that, so Instagram gets a white-padded rendition when needed
// while Facebook and Pinterest keep the original proportions.

type Logger = { error: (msg: string) => void };

export type DeliveryResult = SocialPostResult & {
  /** Platforms a send was actually attempted on. */
  platforms: SocialPlatform[];
};

/** A filesystem-safe name for the padded Instagram rendition. */
export function imageSlugFrom(title: string | null | undefined): string {
  const slug = (title ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "social-post";
}

export async function deliverSocialPost({
  post,
  platforms,
  imageUrl,
  imageSlug,
  logger,
  pinterestOptions,
}: {
  post: string;
  platforms: SocialPlatform[];
  imageUrl?: string | null;
  imageSlug: string;
  logger: Logger;
  pinterestOptions?: { link?: string; title?: string };
}): Promise<DeliveryResult> {
  if (!imageUrl || !platforms.includes("instagram")) {
    const result = await sendSocialPost({
      post,
      platforms,
      mediaUrls: imageUrl ? [imageUrl] : undefined,
      pinterestOptions,
    });
    return { ...result, platforms };
  }

  const original = absoluteMediaUrl(imageUrl);
  const igImageUrl = await instagramSafeImageUrl(original, imageSlug, logger);

  if (igImageUrl === original) {
    const result = await sendSocialPost({
      post,
      platforms,
      mediaUrls: [original],
      pinterestOptions,
    });
    return { ...result, platforms };
  }

  // Tall or wide artwork: Instagram gets the padded rendition, everything
  // else gets the original.
  const others = platforms.filter((p) => p !== "instagram");
  const [rest, ig] = await Promise.all([
    others.length
      ? sendSocialPost({
          post,
          platforms: others,
          mediaUrls: [original],
          pinterestOptions,
        })
      : Promise.resolve<SocialPostResult | null>(null),
    igImageUrl
      ? sendSocialPost({
          post,
          platforms: ["instagram"],
          mediaUrls: [igImageUrl],
        })
      : Promise.resolve<SocialPostResult>({
          ok: false,
          summary: "instagram: FAILED (could not prepare an Instagram-safe image)",
        }),
  ]);

  return {
    ok: (rest?.ok ?? true) && ig.ok,
    summary: rest ? `${rest.summary} | ${ig.summary}` : ig.summary,
    platforms: igImageUrl ? platforms : others,
  };
}
