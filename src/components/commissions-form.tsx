"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { RadioGroup } from "@/components/ui/radio-group";

type Status = "idle" | "submitting" | "success" | "error";

const SIZE_OPTIONS = [
  { value: "small",    label: "Small",    description: "Up to 12×16 in" },
  { value: "medium",   label: "Medium",   description: "Up to 20×24 in" },
  { value: "large",    label: "Large",    description: "Up to 30×40 in" },
  { value: "oversize", label: "Not sure", description: "Let&rsquo;s talk" },
];

export function CommissionsForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [size, setSize] = useState<string>("medium");

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
      setSize("medium");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-[var(--radius-lg)] bg-primary-container-dim text-on-primary-container p-10 text-center">
        <p className="font-serif text-3xl">Thank you.</p>
        <p className="mt-4 text-[16px] leading-relaxed">
          I&rsquo;ll read your note carefully and write back personally
          within a few days. If you have reference photos ready, hold onto
          them — I&rsquo;ll ask for them in my reply.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Your name" required>
          <Input name="name" required autoComplete="name" />
        </Field>
        <Field label="Email" required>
          <Input name="email" type="email" required autoComplete="email" />
        </Field>
      </div>

      <Field label="Subject of the painting" required>
        <Input
          name="subject"
          required
          placeholder="e.g. Our golden retriever, Moose"
        />
      </Field>

      <Field label="Rough size">
        <RadioGroup
          name="size"
          value={size}
          onChange={setSize}
          options={SIZE_OPTIONS.map((o) => ({
            ...o,
            description: <span dangerouslySetInnerHTML={{ __html: o.description }} />,
          }))}
          columns={4}
        />
      </Field>

      <Field label="Target timeline">
        <Input
          name="timeline"
          placeholder="e.g. holiday gift, no rush, anniversary in May…"
        />
      </Field>

      <Field
        label="Tell me about the animal"
        required
      >
        <Textarea
          name="message"
          required
          rows={7}
          placeholder="Who are they, what do you love about them, the funny habits, the rescue story, the photo on your phone you can&rsquo;t stop looking at. Anything that helps me see them."
        />
      </Field>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-2">
        <Button type="submit" size="lg" disabled={status === "submitting"}>
          {status === "submitting" ? "Sending…" : "Send the note"}
        </Button>
        <p className="text-[13px] text-on-surface-subtle">
          I read every inquiry myself. No automated responses.
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
