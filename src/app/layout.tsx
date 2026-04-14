import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "opsz"],
});

export const metadata: Metadata = {
  title: {
    default: "Barbara Demers — Animal Paintings",
    template: "%s · Barbara Demers",
  },
  description:
    "Original animal paintings and commissioned work by Barbara Demers.",
};

const navLinks = [
  { href: "/gallery", label: "Gallery" },
  { href: "/commissions", label: "Commissions" },
  { href: "/blog", label: "Journal" },
  { href: "/about", label: "About" },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-border">
          <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
            <Link
              href="/"
              className="font-serif text-xl tracking-tight text-foreground"
            >
              Barbara Demers
            </Link>
            <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-border mt-24">
          <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <p className="font-serif text-lg">Barbara Demers</p>
              <p className="text-sm text-muted-foreground mt-1">
                Original animal paintings · Commissions welcome
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Barbara Demers. All artwork
              rights reserved.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
