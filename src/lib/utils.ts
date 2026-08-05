import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// These live here (not in data/paintings.ts) so client components can use
// them without pulling the Payload server client into the bundle.
export function printLabel(opt: { widthIn: number; heightIn: number }): string {
  return `${opt.widthIn} × ${opt.heightIn} in`;
}

/** Lowest print price, for "Prints from $X" copy. Undefined when no prints. */
export function lowestPrintPriceCents(p: {
  prints?: { priceCents: number }[];
}): number | undefined {
  if (!p.prints?.length) return undefined;
  return Math.min(...p.prints.map((opt) => opt.priceCents));
}

export function formatPrice(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
