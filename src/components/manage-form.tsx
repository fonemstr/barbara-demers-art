"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

// Asks for a "manage my subscription" link by email. The reply is the
// same whether or not the address is subscribed.
export function ManageForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/post/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong");
      }
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-[var(--radius-lg)] bg-surface-container-lowest p-6 text-center shadow-ambient-sm">
        <p className="font-serif text-xl text-on-surface">Check your inbox.</p>
        <p className="mt-2 text-sm text-on-surface-muted">
          If {email} has a subscription, a link is on its way. It works for an hour.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[var(--radius-lg)] bg-surface-container-lowest p-5 sm:p-6 shadow-ambient-sm">
      <Field label="The email you subscribed with" required>
        <Input
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@studio.com"
        />
      </Field>
      <div className="mt-5">
        <Button type="submit" size="md" disabled={status === "loading"}>
          {status === "loading" ? "Sending…" : "Email me a link"}
        </Button>
      </div>
      {error && (
        <p className="mt-3 text-sm text-[color:var(--error)]" role="alert">{error}</p>
      )}
    </form>
  );
}
