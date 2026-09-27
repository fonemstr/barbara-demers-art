"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ALL_INTERESTS, type Interest } from "@/lib/newsletter-topics";

const LABELS: Record<Interest, string> = {
  artwork: "Original artwork",
  budderlee: "Budderlee news",
};

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [interests, setInterests] = useState<Interest[]>(ALL_INTERESTS);

  function toggle(interest: Interest) {
    setError(null);
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((i) => i !== interest)
        : ALL_INTERESTS.filter((i) => i === interest || current.includes(i)),
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (interests.length === 0) {
      setError("Pick at least one kind of news.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setError(null);

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, interests }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Signup failed");
      }
      setStatus("success");
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="text-sm text-on-surface-muted">
        Thank you — you&rsquo;re on the list.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col sm:flex-row items-stretch gap-3 p-2 sm:pl-5 sm:pr-2 rounded-full bg-surface-container-lowest shadow-ambient-sm">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@studio.com"
          className="flex-1 bg-transparent px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-faint focus:outline-none"
        />
        <Button type="submit" size="md" disabled={status === "loading"} className="shrink-0">
          {status === "loading" ? "Joining…" : "Join the studio list"}
        </Button>
      </div>
      <fieldset className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-on-surface-muted">
        <legend className="sr-only">Send me news about</legend>
        {ALL_INTERESTS.map((interest) => (
          <label key={interest} className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={interests.includes(interest)}
              onChange={() => toggle(interest)}
              className="h-4 w-4 accent-[color:var(--primary)]"
            />
            {LABELS[interest]}
          </label>
        ))}
      </fieldset>
      {error && (
        <p className="mt-3 text-sm text-center text-[color:var(--error)]" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
