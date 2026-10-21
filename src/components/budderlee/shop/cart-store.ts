"use client";

import { useSyncExternalStore } from "react";
import { MAX_LINES, MAX_QUANTITY } from "@/lib/shop-shared";

// The Village Store cart lives in the visitor's browser. It only holds
// which option and how many; names and prices are read fresh from the
// shop, and the checkout route prices everything again on the server.

export type CartLine = { slug: string; variantId: string; quantity: number };

const KEY = "budderlee-cart";
const EMPTY: CartLine[] = [];
const listeners = new Set<() => void>();
let cache: { raw: string | null; lines: CartLine[] } = { raw: null, lines: EMPTY };

function read(): CartLine[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cache.raw) return cache.lines;
  let lines: CartLine[] = EMPTY;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      lines = parsed.filter(
        (l): l is CartLine =>
          typeof l?.slug === "string" && typeof l?.variantId === "string" && Number.isInteger(l?.quantity) && l.quantity > 0,
      );
    }
  } catch {
    // a damaged cart starts over
  }
  cache = { raw, lines };
  return lines;
}

function write(lines: CartLine[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    // private windows can refuse storage; the cart just won't persist
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === KEY && listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCart() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** Adds to the cart. Returns false when the cart already holds too many different things. */
export function addToCart(slug: string, variantId: string, quantity: number) {
  const lines = read();
  const existing = lines.find((l) => l.variantId === variantId);
  if (!existing && lines.length >= MAX_LINES) return false;
  write(
    existing
      ? lines.map((l) =>
          l.variantId === variantId ? { ...l, quantity: Math.min(MAX_QUANTITY, l.quantity + quantity) } : l,
        )
      : [...lines, { slug, variantId, quantity: Math.min(MAX_QUANTITY, quantity) }],
  );
  return true;
}

export function setQuantity(variantId: string, quantity: number) {
  write(
    quantity <= 0
      ? read().filter((l) => l.variantId !== variantId)
      : read().map((l) => (l.variantId === variantId ? { ...l, quantity: Math.min(MAX_QUANTITY, quantity) } : l)),
  );
}

export function clearCart() {
  write([]);
}
