"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const FAQ = [
  {
    q: "How long does a commission take?",
    a: "Typically 4–6 weeks from when reference photos are approved. Holiday season (October onward) fills up early, so reach out by August if you want a December delivery.",
  },
  {
    q: "What about pricing?",
    a: "Price depends on size, subject complexity, and number of figures — I'd rather quote you on the specific painting than throw a number you'll have to caveat. Send the note, I'll write back with a real estimate within a few days.",
  },
  {
    q: "What kind of reference photos do I need?",
    a: "Three or four good photos beat thirty bad ones. Natural light, eye-level with the animal, a couple of different angles. Phone photos are fine — I'll help you pick the strongest reference once I see what you have.",
  },
  {
    q: "Can you paint from old or low-quality photos?",
    a: "Often, yes — for animals who've passed, I'll work from whatever you have. I may combine multiple references and call you to ask follow-up questions about colour and personality.",
  },
  {
    q: "Do you ship internationally?",
    a: "Yes, with insured tracked shipping. International commissions take a little longer for safe packing and customs paperwork.",
  },
  {
    q: "Can I see the painting before it ships?",
    a: "Always. You'll get progress photos at the block-in stage and again at the finish. Small adjustments are part of the process — I want you to love it.",
  },
];

export function CommissionsFAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <ul className="flex flex-col gap-3">
      {FAQ.map((item, i) => {
        const isOpen = open === i;
        return (
          <li
            key={item.q}
            className={cn(
              "rounded-[var(--radius-lg)] transition-colors duration-[160ms]",
              isOpen
                ? "bg-surface-container"
                : "bg-surface-container-low hover:bg-surface-container"
            )}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
            >
              <span className="font-serif text-[19px] leading-snug text-on-surface">
                {item.q}
              </span>
              <span
                aria-hidden
                className={cn(
                  "shrink-0 text-primary text-2xl transition-transform duration-[240ms] ease-[cubic-bezier(.22,1,.36,1)]",
                  isOpen && "rotate-45"
                )}
              >
                +
              </span>
            </button>
            {isOpen && (
              <div className="px-6 pb-6 text-[16px] leading-relaxed text-on-surface-muted text-pretty">
                {item.a}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
