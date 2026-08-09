import type { MetadataRoute } from "next";
import { getAllPaintings } from "@/data/paintings";
import { getAllPosts } from "@/lib/blog";
import { SITE_URL } from "@/lib/site-url";

// Metadata routes are cached by default; refresh hourly so new paintings
// and journal posts appear without a redeploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [paintings, posts] = await Promise.all([
    getAllPaintings(),
    getAllPosts(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/gallery`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/budderlee`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.6 },
    {
      url: `${SITE_URL}/commissions`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    { url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.7 },
  ];

  const paintingPages: MetadataRoute.Sitemap = paintings.map((p) => ({
    url: `${SITE_URL}/gallery/${p.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticPages, ...paintingPages, ...postPages];
}
