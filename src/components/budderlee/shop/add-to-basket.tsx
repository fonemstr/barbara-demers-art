"use client";

import Link from "next/link";
import { useState } from "react";
import { MAX_QUANTITY, formatPrice, soldOut, type ShopVariant } from "@/lib/shop-shared";
import { addToCart, useCart } from "./cart-store";
import s from "../budderlee.module.css";

// The option picker, quantity and "Add to basket" on a product page.
export function AddToBasket({ slug, variants }: { slug: string; variants: ShopVariant[] }) {
  const firstAvailable = variants.find((v) => !soldOut(v)) ?? variants[0];
  const [variantId, setVariantId] = useState(firstAvailable?.id);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const cart = useCart();

  const variant = variants.find((v) => v.id === variantId) ?? firstAvailable;
  if (!variant) return null;
  const out = soldOut(variant);
  const inBasket = cart.find((l) => l.variantId === variant.id)?.quantity ?? 0;
  const max = Math.max(1, Math.min(MAX_QUANTITY, variant.stock ?? MAX_QUANTITY) - inBasket);

  function add() {
    if (!variant || out) return;
    const n = Math.min(quantity, max);
    if (!addToCart(slug, variant.id, n)) {
      setMessage({ text: "Your basket is full. Check out first, then come back for more.", ok: false });
      return;
    }
    setMessage({ text: `Added ${n} to your basket.`, ok: true });
    setQuantity(1);
  }

  return (
    <div className="mt-6">
      {variants.length > 1 && (
        <fieldset>
          <legend className="text-sm uppercase tracking-[0.18em] text-on-surface-subtle">Choose</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {variants.map((v) => {
              const selected = v.id === variant.id;
              return (
                <label key={v.id} className={`${s.optionChip} ${selected ? s.optionChipOn : ""} ${soldOut(v) ? s.optionChipOut : ""}`}>
                  <input
                    type="radio"
                    name="variant"
                    value={v.id}
                    checked={selected}
                    onChange={() => {
                      setVariantId(v.id);
                      setMessage(null);
                    }}
                    className="sr-only"
                  />
                  {v.label} · {formatPrice(v.priceCents)}
                  {soldOut(v) && " · sold out"}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      <p className="mt-5 text-[28px] text-on-surface">{formatPrice(variant.priceCents)}</p>
      {variant.stock !== undefined && variant.stock > 0 && variant.stock <= 10 && (
        <p className="text-[15px] italic text-on-surface-subtle">Only {variant.stock} left</p>
      )}

      {out ? (
        <p className="mt-4 text-lg italic">Sold out for now.</p>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-[15px]">
            Quantity
            <select
              value={Math.min(quantity, max)}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className={s.select}
            >
              {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={add} className={s.button}>
            Add to basket
          </button>
        </div>
      )}

      <div aria-live="polite" className="mt-3 min-h-6 text-[15px]">
        {message && (
          <span className={message.ok ? "" : "text-[var(--bd-rust)]"}>
            {message.text}{" "}
            {message.ok && (
              <Link href="/budderlee/shop/basket" className="underline underline-offset-4">
                View basket
              </Link>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
