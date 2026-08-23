import type { MetadataRoute } from "next";
import { getAllPaintings } from "@/data/paintings";
import { getAllPosts } from "@/lib/blog";
import { SITE_URL } from "@/lib/site-url";

// Metadata routes are cached by default; refresh hourly so new paintings
// and journal posts appear without a redeploy.
export const revalidate = 3600;

// Google uses lastmod (and ignores changefreq/priority), so only real
// modification times are emitted — never a fake "now". Image entries put
// every painting into Google Images with its page as the landing URL.

const toAbsolute = (src: string) =>
  src.startsWith("http") ? src : `${SITE_URL}${src}`;
const realImages = (srcs: string[]) =>
  srcs.filter((s) => !s.includes("placeholder")).map(toAbsolute);
const latest = (dates: (string | undefined)[]) => {
  const ms = dates
    .filter((d): d is string => !!d)
    .map((d) => new Date(d).getTime())
    .filter((n) => !Number.isNaN(n));
  return ms.length ? new Date(Math.max(...ms)) : undefined;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [paintings, posts] = await Promise.all([
    getAllPaintings(),
    getAllPosts(),
  ]);

  // Listing pages change whenever their newest item does.
  const galleryLastMod = latest(paintings.map((p) => p.updatedAt));
  const budderleeLastMod = latest(
    paintings.filter((p) => p.collection === "budderlee").map((p) => p.updatedAt),
  );
  const blogLastMod = latest(posts.map((p) => p.date));

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: galleryLastMod },
    { url: `${SITE_URL}/gallery`, lastModified: galleryLastMod },
    { url: `${SITE_URL}/budderlee`, lastModified: budderleeLastMod ?? galleryLastMod },
    { url: `${SITE_URL}/commissions` },
    { url: `${SITE_URL}/about` },
    { url: `${SITE_URL}/blog`, lastModified: blogLastMod },
  ];

  const paintingPages: MetadataRoute.Sitemap = paintings.map((p) => {
    const images = realImages(p.images);
    return {
      url: `${SITE_URL}/gallery/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
      ...(images.length ? { images } : {}),
    };
  });

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    ...(post.cover ? { images: [toAbsolute(post.cover)] } : {}),
  }));

  return [...staticPages, ...paintingPages, ...postPages];
}
