import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { ArtistNote } from "@/components/ui/artist-note";
import { Section } from "@/components/ui/section";
import { Blob } from "@/components/ui/blob";

export const metadata = {
  title: "Commission reserved",
  robots: { index: false, follow: false },
};

const NEXT_STEPS = [
  {
    title: "Barbara will confirm",
    body: "She'll write to you personally within a day or two to confirm your spot and gather the reference photos you discussed.",
  },
  {
    title: "Progress photos",
    body: "You'll see the painting take shape — progress photos come to your inbox as the work moves along.",
  },
  {
    title: "Balance on completion",
    body: "Your deposit counts toward the final price. The balance is due when the painting is finished and you've seen the final photo, before it ships.",
  },
];

export default function CommissionReservedPage() {
  return (
    <>
      <Section tone="surface" pad="md" maxWidth="3xl" className="overflow-hidden">
        <Blob size={360} color="var(--surface-variant)" style={{ left: "50%", top: -60, transform: "translateX(-50%)", opacity: 0.6 }} />
        <Blob size={220} color="var(--secondary-container)" style={{ right: -40, top: 80, opacity: 0.5 }} />
        <div className="relative z-10 text-center">
          <ArtistNote icon="🎨" className="mx-auto">
            Deposit received.
          </ArtistNote>
          <h1 className="mt-6 font-serif text-3xl md:text-5xl leading-[1.1] tracking-[-0.015em] text-balance">
            Your spot is reserved.
          </h1>
          <p className="mt-6 text-lg text-on-surface-muted leading-relaxed text-pretty">
            You&rsquo;ll get a receipt from Stripe, and Barbara now has your
            reservation with the subject you described. The painting starts
            when your place in the schedule comes up.
          </p>
        </div>
      </Section>

      <Section tone="low" pad="md" maxWidth="4xl">
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {NEXT_STEPS.map((t) => (
            <li
              key={t.title}
              className="rounded-[var(--radius-lg)] bg-surface-container-lowest p-6"
            >
              <h2 className="font-serif text-xl leading-tight text-on-surface">
                {t.title}
              </h2>
              <p className="mt-3 text-[15px] text-on-surface-muted leading-relaxed">
                {t.body}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="surface" pad="md" maxWidth="3xl">
        <div className="rounded-[var(--radius-lg)] bg-primary-container-dim text-on-primary-container px-8 py-8 text-center">
          <p className="font-serif italic text-2xl leading-snug text-balance">
            Thank you for trusting me with them. I can&rsquo;t wait to meet
            your animal on the canvas.
          </p>
          <p className="mt-3 font-sans text-sm font-medium">— Barbara</p>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <ButtonLink href="/gallery" variant="secondary" size="md">
            Browse available work
          </ButtonLink>
          <Link
            href="/blog"
            className="text-sm text-on-surface-muted hover:text-on-surface underline underline-offset-[6px] decoration-on-surface-faint"
          >
            Or read notes from the studio →
          </Link>
        </div>
      </Section>
    </>
  );
}
