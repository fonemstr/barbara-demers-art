import sharp from "sharp";
import { put } from "@vercel/blob";

// Instagram feed images must fall between 4:5 (0.8) and 1.91:1. Barbara's
// paintings are often much taller (e.g. 12×30 in), so instead of letting
// Instagram reject them — or cropping the art — pad the short side with
// white so the whole painting stays visible, gallery-mat style.
const MIN_RATIO = 0.8;
const MAX_RATIO = 1.91;

type Logger = { error: (msg: string) => void };

/**
 * Returns a URL Instagram will accept for this image: the original when its
 * aspect ratio is already allowed, otherwise a white-padded rendition
 * uploaded to Blob storage. Null when no safe image could be produced.
 */
export async function instagramSafeImageUrl(
  imageUrl: string,
  slug: string,
  logger: Logger,
): Promise<string | null> {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error(`image fetch failed (HTTP ${res.status})`);
    const original = Buffer.from(await res.arrayBuffer());

    const meta = await sharp(original).metadata();
    if (!meta.width || !meta.height) throw new Error("image has no dimensions");
    const ratio = meta.width / meta.height;
    if (ratio >= MIN_RATIO && ratio <= MAX_RATIO) return imageUrl;

    // Pad toward the nearest allowed ratio, capped near Instagram's
    // preferred sizes (1080×1350 portrait, 1910×1000 landscape).
    let width: number;
    let height: number;
    if (ratio < MIN_RATIO) {
      height = Math.min(meta.height, 1350);
      width = Math.round(height * MIN_RATIO);
    } else {
      width = Math.min(meta.width, 1910);
      height = Math.round(width / MAX_RATIO);
    }

    const inner = await sharp(original)
      .resize({ width, height, fit: "inside" })
      .toBuffer();
    const padded = await sharp({
      create: { width, height, channels: 3, background: "#ffffff" },
    })
      .composite([{ input: inner, gravity: "centre" }])
      .jpeg({ quality: 90 })
      .toBuffer();

    const blob = await put(`social/instagram/${slug}.jpg`, padded, {
      access: "public",
      contentType: "image/jpeg",
      addRandomSuffix: true,
    });
    return blob.url;
  } catch (err) {
    logger.error(`[social] instagram image prep failed for "${slug}": ${err}`);
    return null;
  }
}
