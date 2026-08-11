"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { cn } from "@/lib/utils";

type NavLink = { href: string; label: string };

export function MobileNav({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="relative z-50 -mr-2 flex h-11 w-11 items-center justify-center text-on-surface"
      >
        <span aria-hidden className="relative block h-4 w-6">
          <span
            className={cn(
              "absolute left-0 top-0 block h-[2px] w-full rounded-full bg-current transition-transform duration-[240ms] ease-[cubic-bezier(.22,1,.36,1)]",
              open && "top-1/2 -translate-y-1/2 rotate-45"
            )}
          />
          <span
            className={cn(
              "absolute left-0 top-1/2 block h-[2px] w-full -translate-y-1/2 rounded-full bg-current transition-opacity duration-[160ms]",
              open && "opacity-0"
            )}
          />
          <span
            className={cn(
              "absolute bottom-0 left-0 block h-[2px] w-full rounded-full bg-current transition-transform duration-[240ms] ease-[cubic-bezier(.22,1,.36,1)]",
              open && "bottom-1/2 translate-y-1/2 -rotate-45"
            )}
          />
        </span>
      </button>

      {/* Portaled to <body>: the header's backdrop-blur creates a containing
          block, which would trap a fixed-position overlay inside it. */}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-30 md:hidden backdrop-blur-xl bg-[color-mix(in_srgb,var(--surface)_92%,transparent)]">
            <nav className="flex h-full flex-col justify-center px-8 pb-16">
              <ul className="flex flex-col gap-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="block py-3 font-serif text-3xl tracking-tight text-on-surface"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/gallery"
                onClick={() => setOpen(false)}
                className="btn-primary-face mt-10 inline-flex w-fit items-center rounded-full px-6 py-3 text-base font-semibold"
              >
                View available work
              </Link>
            </nav>
          </div>,
          document.body
        )}
    </div>
  );
}
