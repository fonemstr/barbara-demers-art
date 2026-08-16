import type { Metadata } from "next";
import { Noto_Serif, Plus_Jakarta_Sans, Be_Vietnam_Pro } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { MobileNav } from "@/components/mobile-nav";
import { getFeaturedPaintings } from "@/data/paintings";
import { SITE_URL } from "@/lib/site-url";
import "../globals.css";

const notoSerif = Noto_Serif({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
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

const navLinks = [
  { href: "/gallery", label: "Available Work" },
  { href: "/budderlee", label: "Budderlee" },
  { href: "/blog", label: "Journal" },
  { href: "/about", label: "About" },
  { href: "/commissions", label: "Commissions" },
];

export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${notoSerif.variable} ${plusJakarta.variable} ${beVietnam.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-surface text-on-surface">
        {/* Top nav — glass over paper, no dividers */}
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-[color-mix(in_srgb,var(--surface)_72%,transparent)]">
          <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
            <Link
              href="/"
              aria-label="Barbara J Demers — home"
              className="flex items-center gap-3 text-on-surface"
            >
              <Image
                src="/brand/monogram-96.webp"
                alt=""
                width={71}
                height={48}
                priority
                className="h-10 w-auto"
              />
              <Image
                src="/brand/name-40.webp"
                alt="Barbara J. Demers"
                width={281}
                height={20}
                priority
                className="hidden sm:block h-[15px] w-auto"
              />
            </Link>
            <nav className="hidden md:flex items-center gap-9 text-[15px]">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-on-surface-muted hover:text-on-surface transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/gallery"
                className="btn-primary-face inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold"
              >
                View available work
              </Link>
            </nav>
            <MobileNav links={navLinks} />
          </div>
        </header>

        <main className="flex-1">{children}</main>

        {/* Footer — uses a layered surface shift instead of a hairline */}
        <footer className="mt-24 bg-surface-container-low">
          <div className="mx-auto max-w-6xl px-6 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <Image
                src="/brand/lockup-160.webp"
                alt="Barbara J. Demers, Artist"
                width={231}
                height={160}
                className="h-20 w-auto"
              />
              <p className="text-sm text-on-surface-muted mt-4">
                Original expressive realism paintings · 10% of profits donated to animal welfare
              </p>
            </div>
            <div className="text-sm text-on-surface-subtle">
              © {new Date().getFullYear()} Barbara J Demers. All artwork
              rights reserved.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
