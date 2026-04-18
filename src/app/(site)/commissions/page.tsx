import Image from "next/image";
import { CommissionsForm } from "@/components/commissions-form";
import { CommissionsFAQ } from "@/components/commissions-faq";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ArtistNote } from "@/components/ui/artist-note";
import { Blob } from "@/components/ui/blob";

export const metadata = { title: "Commissions" };

const PROCESS_STEPS = [
  {
    title: "Send me their photos",
    body: "Three or four favourites and a note about what you want to remember.",
  },
  {
    title: "We talk personality",
    body: "A short call so I can hear the story and learn the small specific things.",
  },
  {
    title: "Oil on linen",
    body: "Built up in glazes over a warm underpainting. Progress photos along the way.",
  },
  {
    title: "Shipped from the studio",
    body: "Packed by hand, insured, on its way within 4–6 weeks.",
  },
];

export default function CommissionsPage() {
  return (
    <>
      {/* HEADER */}
      <Section tone="surface" pad="md">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <Blob size={420} color="var(--surface-variant)" style={{ left: -120, top: -40, opacity: 0.7 }} />
          <Blob size={220} color="var(--secondary-container)" style={{ right: 60, top: 80, opacity: 0.45 }} />
        </div>
        <div className="relative z-10">
          <PageHeader
            eyebrow="Commissions"
            title={
              <>
                A painting of the
                <br className="hidden md:block" /> one you love.
              </>
            }
            lede="I take a small number of commissions a year so I can stay present on each one. Send me a note about your animal and I'll write back personally within a few days."
          >
            <ArtistNote icon="✉️" rotate={-1.2}>
              Open for inquiries — no waitlist right now.
            </ArtistNote>
          </PageHeader>
        </div>
      </Section>

      {/* PROCESS — short version */}
      <Section tone="surface" pad="sm">
        <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PROCESS_STEPS.map((step, i) => (
            <li
              key={step.title}
              className="rounded-[var(--radius-lg)] bg-surface-container-low p-6"
            >
              <div className="font-serif italic text-4xl text-primary leading-none">
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="mt-4 font-serif text-xl leading-tight text-on-surface">
                {step.title}
              </h3>
              <p className="mt-2 text-[14px] text-on-surface-muted leading-relaxed">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      {/* FORM + TRUST PANEL */}
      <Section tone="low" pad="lg" className="overflow-hidden">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] items-start">
          {/* Form */}
          <div className="rounded-[var(--radius-lg)] bg-surface-container-lowest p-8 md:p-10 shadow-ambient-sm">
            <Eyebrow>Start the conversation</Eyebrow>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl leading-tight">
              Tell me about your animal.
            </h2>
            <p className="mt-3 text-on-surface-muted leading-relaxed">
              The more you can tell me about who they are, the better the
              first conversation goes. No pressure to know your size or
              budget yet — we&rsquo;ll work that out together.
            </p>
            <div className="mt-8">
              <CommissionsForm />
            </div>
          </div>

          {/* Trust panel — testimonial + studio photo */}
          <aside className="flex flex-col gap-8 lg:sticky lg:top-28">
            <div className="relative">
              <Blob size={260} color="var(--surface-variant)" style={{ right: -30, top: -20, opacity: 0.7 }} />
              <div
                className="relative z-[1] aspect-[4/5] overflow-hidden rounded-[var(--radius-xl)] shadow-ambient-lg"
                style={{ transform: "rotate(1.2deg)" }}
              >
                <Image
                  src="/paintings/placeholder-2.svg"
                  alt="A commission in progress in the studio"
                  fill
                  sizes="(min-width: 1024px) 30vw, 90vw"
                  className="object-cover"
                />
              </div>
            </div>
            <blockquote
              className="rounded-[28px] bg-primary-container-dim text-on-primary-container px-7 py-6 font-serif italic text-xl leading-snug"
              style={{ transform: "rotate(-1deg)" }}
            >
              &ldquo;She captured Biscuit&rsquo;s eyebrows so perfectly I
              cried. I cried! Over eyebrows!&rdquo;
              <footer className="mt-4 not-italic font-sans text-sm font-medium">
                — Maren, Portland
              </footer>
            </blockquote>
            <div className="rounded-[var(--radius-md)] bg-surface-container p-6">
              <p className="font-serif text-lg text-on-surface leading-tight">
                What&rsquo;s included
              </p>
              <ul className="mt-3 flex flex-col gap-2 text-[14px] text-on-surface-muted leading-relaxed">
                <li>· An original oil painting on linen or panel</li>
                <li>· Progress photos at block-in and finish</li>
                <li>· Small adjustments before final varnish</li>
                <li>· Insured shipping, packed by hand</li>
                <li>· A handwritten note in the box</li>
              </ul>
            </div>
          </aside>
        </div>
      </Section>

      {/* FAQ */}
      <Section tone="surface" pad="lg">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] items-start">
          <div>
            <Eyebrow>Common questions</Eyebrow>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl leading-tight">
              The things people most often ask before reaching out.
            </h2>
            <p className="mt-4 text-on-surface-muted leading-relaxed">
              Anything else? Mention it in your note and I&rsquo;ll answer
              when I write back.
            </p>
          </div>
          <CommissionsFAQ />
        </div>
      </Section>
    </>
  );
}
