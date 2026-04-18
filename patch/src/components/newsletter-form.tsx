"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setError(null);

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row items-stretch gap-3 p-2 sm:pl-5 sm:pr-2 rounded-full bg-surface-container-lowest shadow-ambient-sm"
    >
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
      {error && (
        <p className="text-sm text-[color:var(--error)] w-full px-4" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
