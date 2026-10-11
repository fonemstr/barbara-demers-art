import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { getFeaturedPaintings } from "@/data/paintings";
import { SITE_URL } from "@/lib/site-url";
import { JsonLd } from "@/components/json-ld";
import { siteGraph } from "@/lib/schema";
import "../globals.css";

// Only the weights actually used: headings are serif 700, the italic
// accents in heroes are serif 400, body is sans 400 with 500/600 accents.
// Fewer font files on the critical path is the biggest LCP win on the site.
// Fonts are self-hosted (Google's Latin files via Fontsource, OFL licenses
// alongside): fetching them from Google at build time intermittently
// failed Vercel builds.
const notoSerif = localFont({
  variable: "--font-noto-serif",
  src: [
    { path: "../fonts/noto-serif/noto-serif-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/noto-serif/noto-serif-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "../fonts/noto-serif/noto-serif-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "../fonts/noto-serif/noto-serif-latin-700-italic.woff2", weight: "700", style: "italic" },
  ],
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

const plusJakarta = localFont({
  variable: "--font-plus-jakarta",
  src: [
    { path: "../fonts/plus-jakarta-sans/plus-jakarta-sans-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/plus-jakarta-sans/plus-jakarta-sans-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../fonts/plus-jakarta-sans/plus-jakarta-sans-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
  display: "swap",
});

const SITE_DESCRIPTION =
  "Original expressive realism paintings of animals, insects, and the natural world — created with bold color, symbolic detail, and narrative titles by Barbara J Demers.";

// Dynamic so the default social-share image is a real painting rather than
// a placeholder asset. Pages that define their own `openGraph` (artwork and
// journal posts) override this wholesale.
export async function generateMetadata(): Promise<Metadata> {
  const featured = await getFeaturedPaintings(1);
  const shareImage = featured[0]?.images[0];

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: "Barbara J Demers — Original Expressive Realism Paintings",
      template: "%s · Barbara J Demers",
    },
    description: SITE_DESCRIPTION,
    openGraph: {
      type: "website",
      siteName: "Barbara J Demers",
      title: "Barbara J Demers — Original Expressive Realism Paintings",
      description: SITE_DESCRIPTION,
      images: shareImage ? [shareImage] : undefined,
    },
    twitter: {
      card: shareImage ? "summary_large_image" : "summary",
    },
  };
}

export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // The artist entity's image: the featured painting, same as the share image.
  const featured = await getFeaturedPaintings(1);
  const siteShareImage = featured[0]?.images[0];
  return (
    <html
      lang="en"
      className={`${notoSerif.variable} ${plusJakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-surface text-on-surface">
        <JsonLd data={siteGraph(siteShareImage)} />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
