import Image from "next/image";
import Link from "next/link";
import s from "./budderlee.module.css";
import { Ornament } from "./parts";
import { BudderleeNav } from "./nav-links";
import { navLinks } from "@/lib/site-nav";

// Budderlee pages replace the site's top menu with this masthead: the
// artist on the left (back to the main site), the Budderlee wordmark in the
// middle (back to the welcome page), the village motto on the right, and
// the four section links beneath.
export function BudderleeMasthead() {
  return (
    <header className={s.masthead}>
      <div className={s.mastheadRow}>
        <Link href="/" className={s.artist} aria-label="Barbara J. Demers, Artist: the main site">
          <span className={s.artistName}>Barbara J. Demers</span>
          <span className={s.artistRole}>Artist</span>
        </Link>
        <Link href="/budderlee" className={s.wordmark} aria-label="Budderlee: welcome page">
          <span className={s.wordmarkText}>Budderlee</span>
          <Ornament width={54} />
        </Link>
        <div className={s.tagline}>
          <Image src="/budderlee/seal.webp" alt="" width={44} height={44} className="hidden sm:block" />
          <span>
            A kinder
            <br />
            place for
            <br />
            brighter days
          </span>
        </div>
      </div>
      <BudderleeNav />
    </header>
  );
}

export function BudderleeFooter() {
  return (
    <footer className={s.footer}>
      <Ornament width={54} />
      <Link href="/" className="mt-2 inline-block font-serif text-xl text-on-surface">
        Barbara J. Demers, Artist
      </Link>
      <div className={s.footerLinks}>
        {navLinks
          .filter((l) => l.href !== "/budderlee")
          .map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        <Link href="/privacy">Privacy</Link>
      </div>
      <p className="mt-3 text-sm text-on-surface-faint">
        © {new Date().getFullYear()} Barbara J Demers. All artwork rights reserved.
      </p>
    </footer>
  );
}
