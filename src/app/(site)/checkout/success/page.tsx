import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { ArtistNote } from "@/components/ui/artist-note";
import { Section } from "@/components/ui/section";
import { Blob } from "@/components/ui/blob";

export const metadata = { title: "Order received" };

const TRUST = [
  {
    title: "Packed by hand",
    body: "Wrapped in glassine, double-boxed with corner protection. I do this part myself.",
  },
  {
    title: "Insured shipping",
    body: "Tracked + insured the whole way. You'll get a tracking number when it leaves the studio.",
  },
  {
    title: "Within 5 business days",
    body: "Available originals ship from the studio within five working days. Commissions follow their own timeline.",
  },
];

export default function CheckoutSuccessPage() {
  return (
    <>
      <Section tone="surface" pad="md" maxWidth="3xl" className="overflow-hidden">
        <Blob size={360} color="var(--surface-variant)" style={{ left: "50%", top: -60, transform: "translateX(-50%)", opacity: 0.6 }} />
        <Blob size={220} color="var(--secondary-container)" style={{ right: -40, top: 80, opacity: 0.5 }} />
        <div className="relative z-10 text-center">
          <ArtistNote icon="🎉" className="mx-auto">
            Order confirmed.
          </ArtistNote>
          <h1 className="mt-6 font-serif text-5xl md:text-6xl leading-[1.05] tracking-[-0.02em] text-balance">
            Your painting is on its way.
          </h1>
          <p className="mt-6 text-lg text-on-surface-muted leading-relaxed text-pretty">
            You&rsquo;ll get a confirmation email from Stripe with your
            receipt. I&rsquo;ll write to you personally within a day or two
            to let you know exactly when your piece ships from the studio.
          </p>
        </div>
      </Section>

      <Section tone="low" pad="md" maxWidth="4xl">
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TRUST.map((t) => (
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
            Thank you for letting one of these into your home.
          </p>
          <p className="mt-3 font-sans text-sm font-medium">— Barbara</p>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <ButtonLink href="/gallery" variant="secondary" size="md">
            Back to available work
          </ButtonLink>
          <Link
            href="/commissions"
            className="text-sm text-on-surface-muted hover:text-on-surface underline underline-offset-[6px] decoration-on-surface-faint"
          >
            Or start a commission →
          </Link>
        </div>
      </Section>
    </>
  );
}
