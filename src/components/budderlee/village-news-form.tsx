"use client";

import { useState } from "react";
import s from "./budderlee.module.css";

// "Stay connected": one email field that joins the studio list with only
// the Budderlee topic ticked.
export function VillageNewsForm() {
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
        body: JSON.stringify({ email, interests: ["budderlee"] }),
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
    return <p className="text-center text-lg italic">Thank you. Village news is on its way.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-xl flex-col gap-3 sm:flex-row">
      <label htmlFor="village-news-email" className="sr-only">
        Your email address
      </label>
      <input
        id="village-news-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        className="flex-1 rounded-[6px] border border-[color:var(--outline)] bg-[#fffdf8] px-4 py-3 text-[16px] text-on-surface placeholder:text-on-surface-faint focus:border-[color:var(--primary)] focus:outline-none"
      />
      <button type="submit" disabled={status === "loading"} className={`${s.button} shrink-0 disabled:opacity-60`}>
        {status === "loading" ? "Joining…" : "Send Me Village News"}
      </button>
      {error && (
        <p className="text-sm text-[color:var(--error)] sm:basis-full" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
