"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export function CommissionsForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError(null);

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/commissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not send inquiry");
      }
      setStatus("success");
      (event.target as HTMLFormElement).reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="border border-border bg-muted p-8 text-center">
        <p className="font-serif text-2xl">Thank you.</p>
        <p className="mt-3 text-muted-foreground">
          Barbara will read your note and get back to you personally within
          a few days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Your name" name="name" required />
        <Field label="Email" name="email" type="email" required />
      </div>

      <Field label="Subject of the painting" name="subject" required placeholder="e.g. Our golden retriever, Moose" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Preferred size" name="size" placeholder="e.g. 16×20 in" />
        <Field label="Target timeline" name="timeline" placeholder="e.g. gift for December" />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Tell Barbara about your idea
        </label>
        <textarea
          name="message"
          required
          rows={6}
          placeholder="Who is the animal, what do you love about them, and any reference photos you have. She'll follow up to arrange sharing the photos."
          className="w-full px-4 py-3 bg-card border border-border text-sm focus:outline-none focus:border-foreground"
        />
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="px-6 py-3 bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-60"
      >
        {status === "submitting" ? "Sending…" : "Send inquiry"}
      </button>

      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        {label}
        {required && <span className="text-muted-foreground"> *</span>}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-card border border-border text-sm focus:outline-none focus:border-foreground"
      />
    </div>
  );
}
