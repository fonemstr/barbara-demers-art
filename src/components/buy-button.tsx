"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function BuyButton({ slug }: { slug: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Could not start checkout");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div>
      <Button
        onClick={handleClick}
        disabled={loading}
        size="lg"
        className="w-full"
      >
        {loading ? "Starting checkout…" : "Purchase this painting"}
      </Button>
      {error && (
        <p className="mt-3 text-sm text-[color:var(--error)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
