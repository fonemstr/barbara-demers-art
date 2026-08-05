"use client";

import { useState } from "react";
import type { PrintOption } from "@/data/paintings";
import { formatPrice, printLabel } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RadioGroup } from "@/components/ui/radio-group";

export function PrintBuy({
  slug,
  prints,
}: {
  slug: string;
  prints: PrintOption[];
}) {
  const [selectedId, setSelectedId] = useState(prints[0]?.id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = prints.find((opt) => opt.id === selectedId);

  async function handleClick() {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, printOptionId: selected.id }),
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
    <div className="flex flex-col gap-4">
      <RadioGroup
        name="print-size"
        columns={prints.length >= 3 ? 3 : 2}
        value={selectedId}
        onChange={setSelectedId}
        options={prints.map((opt) => ({
          value: opt.id,
          label: printLabel(opt),
          description: formatPrice(opt.priceCents),
        }))}
      />
      <Button
        onClick={handleClick}
        disabled={loading || !selected}
        size="lg"
        className="w-full"
      >
        {loading
          ? "Starting checkout…"
          : selected
            ? `Purchase print — ${formatPrice(selected.priceCents)}`
            : "Choose a size"}
      </Button>
      {error && (
        <p className="text-sm text-[color:var(--error)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
