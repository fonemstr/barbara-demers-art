"use client";

import { useState } from "react";
import { COMMISSION_TIERS } from "@/data/commissions";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup } from "@/components/ui/radio-group";

export function CommissionDeposit() {
  const [tierId, setTierId] = useState<string>("medium");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tier = COMMISSION_TIERS.find((t) => t.id === tierId);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/commission-deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tierId, subject }),
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Field label="The size you agreed on">
        <RadioGroup
          name="commission-tier"
          value={tierId}
          onChange={setTierId}
          columns={3}
          options={COMMISSION_TIERS.map((t) => ({
            value: t.id,
            label: `${t.label} — ${formatPrice(t.depositCents)} deposit`,
            description: `${t.sizeNote} · from ${formatPrice(t.priceFromCents)}`,
          }))}
        />
      </Field>

      <Field label="Subject of the painting" required>
        <Input
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. Our golden retriever, Moose"
        />
      </Field>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Button type="submit" size="lg" disabled={loading || !tier}>
          {loading
            ? "Starting checkout…"
            : tier
              ? `Reserve with a ${formatPrice(tier.depositCents)} deposit`
              : "Choose a size"}
        </Button>
        <p className="text-[13px] text-on-surface-subtle">
          Secure checkout by Stripe. Applied toward the final price.
        </p>
      </div>

      {error && (
        <p className="text-sm text-[color:var(--error)]" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
