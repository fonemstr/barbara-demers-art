"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

// Starts the Stripe Checkout for The Budderlee Post. Email and address
// are collected by Stripe, so this is a single button.
export function SubscribeButton({ label = "Subscribe" }: { label?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/post/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || "Could not start checkout");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Button onClick={handleClick} disabled={loading} size="lg">
        {loading ? "Opening secure checkout…" : label}
      </Button>
      {error && (
        <p className="text-sm text-[color:var(--error)] text-center" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
