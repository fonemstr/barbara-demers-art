"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

// Waitlist signup for The Budderlee Post. Posts to /api/post/waitlist,
// which stores the row in the admin and sends the confirmation.
export function WaitlistForm({
  source = "budderlee-post-page",
  buttonLabel = "Join the waitlist",
}: {
  source?: string;
  buttonLabel?: string;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError(null);

    const form = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/post/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          source,
          // honeypot; hidden from people, tempting to bots
          website: form.get("website") || "",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Signup failed");
      }
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-[var(--radius-lg)] bg-surface-container-lowest p-6 text-center shadow-ambient-sm">
        <p className="font-serif text-xl text-on-surface">You&rsquo;re on the list.</p>
        <p className="mt-2 text-sm text-on-surface-muted">
          A note is on its way to {email}. You&rsquo;ll hear from Barbara first when signups open.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[var(--radius-lg)] bg-surface-container-lowest p-5 sm:p-6 shadow-ambient-sm"
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_1.3fr]">
        <Field label="First name">
          <Input
            type="text"
            name="name"
            autoComplete="given-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Optional"
            maxLength={120}
          />
        </Field>
        <Field label="Email" required>
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
      </div>
      <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <Button type="submit" size="md" disabled={status === "loading"} className="shrink-0">
          {status === "loading" ? "Joining…" : buttonLabel}
        </Button>
        <p className="text-xs text-on-surface-subtle leading-relaxed">
          No charge, no commitment. One email when signups open, and the Founding Member sticker in your first package.
        </p>
      </div>
      {error && (
        <p className="mt-3 text-sm text-[color:var(--error)]" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
