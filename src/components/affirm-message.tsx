"use client";

import { useEffect, useRef } from "react";
// The pure entry point only adds Stripe.js to the page when loadStripe is
// called, so pages without this component never load it.
import { loadStripe } from "@stripe/stripe-js/pure";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// Affirm's limits for a purchase in the US.
const AFFIRM_MIN_CENTS = 5000;
const AFFIRM_MAX_CENTS = 3000000;

// Light text means a dark background, which needs the white Affirm logo.
function isLight(color: string) {
  const [r, g, b] = (color.match(/\d+(\.\d+)?/g) ?? []).map(Number);
  return r * 0.299 + g * 0.587 + b * 0.114 > 150;
}

/**
 * "As low as $X/mo with Affirm" under a price. Renders nothing until the
 * Stripe publishable key is set, or when the amount is outside Affirm's
 * limits. Checkout itself offers Affirm whenever it's on in Stripe.
 */
export function AffirmMessage({ amountCents }: { amountCents: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const eligible =
    !!publishableKey && amountCents >= AFFIRM_MIN_CENTS && amountCents <= AFFIRM_MAX_CENTS;

  useEffect(() => {
    const node = ref.current;
    if (!eligible || !node) return;
    let element: { destroy(): void } | null = null;
    let cancelled = false;

    loadStripe(publishableKey!)
      .then((stripe) => {
        if (!stripe || cancelled) return;
        const style = getComputedStyle(node);
        const elements = stripe.elements({
          appearance: {
            variables: {
              colorText: style.color,
              fontSizeBase: style.fontSize,
            },
          },
        });
        const messaging = elements.create("paymentMethodMessaging", {
          amount: amountCents,
          currency: "USD",
          countryCode: "US",
          paymentMethodTypes: ["affirm"],
          logoColor: isLight(style.color) ? "white" : "black",
        });
        messaging.mount(node);
        element = messaging;
      })
      .catch((err) => {
        // A blocked script just means no Affirm line; checkout still works.
        console.warn("[affirm-message]", err);
      });

    return () => {
      cancelled = true;
      element?.destroy();
    };
  }, [eligible, amountCents]);

  if (!eligible) return null;
  return <div ref={ref} className="min-h-6 text-sm text-on-surface-muted" />;
}
