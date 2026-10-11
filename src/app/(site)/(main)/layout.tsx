import Link from "next/link";
import Image from "next/image";
import { MobileNav } from "@/components/mobile-nav";
import { SocialLinks } from "@/components/social-links";
import { SOCIAL_PROFILES } from "@/lib/social-profiles";
import { navLinks } from "@/lib/site-nav";

// The main site's chrome: glass top nav and footer. Budderlee pages have
// their own masthead (src/app/(site)/budderlee/layout.tsx) instead.
export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {/* Top nav — glass over paper, no dividers */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[color-mix(in_srgb,var(--surface)_72%,transparent)]">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between gap-6">
          <Link
            href="/"
            aria-label="Barbara J Demers — home"
            className="flex items-center gap-3 text-on-surface shrink-0"
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
              className="hidden sm:block lg:hidden xl:block h-[15px] w-auto"
            />
          </Link>
          <nav className="hidden lg:flex items-center gap-8 text-[15px] whitespace-nowrap shrink-0">
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
          <div className="flex flex-col items-start md:items-end gap-4">
            <SocialLinks profiles={SOCIAL_PROFILES} />
            <div className="text-sm text-on-surface-subtle">
              © {new Date().getFullYear()} Barbara J Demers. All artwork
              rights reserved.
              {" · "}
              <Link href="/privacy" className="hover:text-on-surface transition-colors">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
