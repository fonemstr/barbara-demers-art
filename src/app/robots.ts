import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // /api/ is blocked, but painting originals and og:images are served
      // from /api/media/file/ and Google must be able to fetch those.
      allow: ["/", "/api/media/file/"],
      disallow: ["/admin", "/api/", "/checkout/", "/commissions/reserved"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
