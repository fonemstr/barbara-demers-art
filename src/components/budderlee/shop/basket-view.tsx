"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MAX_QUANTITY, formatPrice, shippingFor, soldOut, type Product, type ShippingSettings } from "@/lib/shop-shared";
import { clearCart, setQuantity, useCart } from "./cart-store";
import s from "../budderlee.module.css";

// The basket page: what's in the browser's cart, priced from the shop's
// current products, and the button that sends it all to Stripe.
export function BasketView({ products, shippingSettings }: { products: Product[]; shippingSettings: ShippingSettings }) {
  const cart = useCart();
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setMounted(true), []);

  const lines = cart.flatMap((line) => {
    const product = products.find((p) => p.variants.some((v) => v.id === line.variantId));
    const variant = product?.variants.find((v) => v.id === line.variantId);
    return product && variant ? [{ line, product, variant }] : [];
  });
  const missing = cart.length - lines.length;

  // Drop anything that has left the shop so checkout isn't blocked by it.
  useEffect(() => {
    if (!mounted || missing === 0) return;
    for (const l of cart) {
      if (!products.some((p) => p.variants.some((v) => v.id === l.variantId))) setQuantity(l.variantId, 0);
    }
  }, [mounted, missing, cart, products]);

  if (!mounted) return <p className="mt-10 text-center italic">Opening your basket…</p>;

  if (lines.length === 0) {
    return (
      <div className="mt-10 text-center">
        <p className="text-lg italic">Your basket is empty.</p>
        <Link href="/budderlee/shop" className={`${s.button} mt-6`}>
          Back to the Village Store
        </Link>
      </div>
    );
  }

  const subtotal = lines.reduce((sum, { line, variant }) => sum + variant.priceCents * line.quantity, 0);
  const shipping = shippingFor(subtotal, shippingSettings);
  const unavailable = lines.some(({ line, variant }) => soldOut(variant) || (variant.stock !== undefined && line.quantity > variant.stock));

  async function checkout() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: lines.map(({ line }) => ({ variantId: line.variantId, quantity: line.quantity })) }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Checkout couldn't start. Please try again.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout couldn't start. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="mt-10">
      <ul className="divide-y divide-[var(--bd-line)] border-y border-[var(--bd-line)]">
        {lines.map(({ line, product, variant }) => {
          const img = product.images[0];
          const cap = Math.min(MAX_QUANTITY, variant.stock ?? MAX_QUANTITY);
          return (
            <li key={line.variantId} className="grid grid-cols-[72px_1fr_auto] items-center gap-4 py-4 sm:grid-cols-[96px_1fr_auto]">
              <Link href={`/budderlee/shop/${product.slug}`}>
                {img ? (
                  <Image
                    src={img.url}
                    alt=""
                    width={img.width ?? 400}
                    height={img.height ?? 400}
                    sizes="96px"
                    className={`${s.photo} h-auto w-full`}
                  />
                ) : (
                  <span className="block aspect-square bg-[var(--bd-sage)]" />
                )}
              </Link>
              <div className="min-w-0">
                <Link href={`/budderlee/shop/${product.slug}`} className="text-[20px] leading-tight hover:text-[var(--bd-olive)]">
                  {product.name}
                </Link>
                {product.variants.length > 1 && <p className="text-[15px] text-on-surface-subtle">{variant.label}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[15px]">
                  <label className="flex items-center gap-2">
                    <span className="sr-only">Quantity of {product.name}</span>
                    <select
                      value={line.quantity}
                      onChange={(e) => setQuantity(line.variantId, Number(e.target.value))}
                      className={s.select}
                    >
                      {Array.from({ length: Math.max(cap, line.quantity) }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => setQuantity(line.variantId, 0)}
                    className="underline underline-offset-4 text-on-surface-subtle hover:text-on-surface"
                  >
                    Remove
                  </button>
                </div>
                {soldOut(variant) ? (
                  <p className="mt-1 text-[15px] text-[var(--bd-rust)]">Sold out; please remove it.</p>
                ) : (
                  variant.stock !== undefined &&
                  line.quantity > variant.stock && (
                    <p className="mt-1 text-[15px] text-[var(--bd-rust)]">Only {variant.stock} left.</p>
                  )
                )}
              </div>
              <p className="text-right text-[18px]">{formatPrice(variant.priceCents * line.quantity)}</p>
            </li>
          );
        })}
      </ul>

      <dl className="ml-auto mt-6 grid max-w-xs grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-[17px]">
        <dt>Subtotal</dt>
        <dd className="text-right">{formatPrice(subtotal)}</dd>
        <dt>{shipping.label}</dt>
        <dd className="text-right">{shipping.cents ? formatPrice(shipping.cents) : "Free"}</dd>
        <dt className="mt-2 border-t border-[var(--bd-line)] pt-2 text-[20px] text-on-surface">Total</dt>
        <dd className="mt-2 border-t border-[var(--bd-line)] pt-2 text-right text-[20px] text-on-surface">
          {formatPrice(subtotal + shipping.cents)}
        </dd>
      </dl>
      <p className="mt-2 text-right text-[14px] text-on-surface-subtle">Any sales tax is added at checkout. US addresses only.</p>

      <div className="mt-6 flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-5 text-[15px]">
          <Link href="/budderlee/shop" className="underline underline-offset-4">
            Keep shopping
          </Link>
          <button type="button" onClick={clearCart} className="underline underline-offset-4 text-on-surface-subtle hover:text-on-surface">
            Empty basket
          </button>
        </div>
        <button type="button" onClick={checkout} disabled={busy || unavailable} className={`${s.button} disabled:opacity-60`}>
          {busy ? "Opening checkout…" : "Check out"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-right text-[15px] text-[var(--bd-rust)]">
          {error}
        </p>
      )}
    </div>
  );
}

/** Empties the basket once an order has gone through. */
export function ClearBasket() {
  useEffect(() => clearCart(), []);
  return null;
}
