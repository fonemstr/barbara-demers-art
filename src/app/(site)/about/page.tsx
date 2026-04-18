import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ArtistNote } from "@/components/ui/artist-note";
import { Blob } from "@/components/ui/blob";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <>
      {/* HEADER */}
      <Section tone="surface" pad="md" className="overflow-hidden">
        <Blob size={360} color="var(--secondary-container)" style={{ right: -80, top: -40, opacity: 0.5 }} />
        <div className="relative z-10">
          <PageHeader
            eyebrow="The lady with the brushes"
            title={
              <>
                A lover first,
                <br /> an artist second.
              </>
            }
            lede="I'm Barbara. I paint the animals I'd want to share a couch with. Here's a little bit about how, and why, and what happens when you ask me to paint yours."
          />
        </div>
      </Section>

      {/* STUDIO PORTRAIT + PULL QUOTE */}
      <Section tone="surface" pad="lg">
        <div className="grid gap-14 md:grid-cols-[0.9fr_1.1fr] items-center">
          {/* Photo — placeholder until a real studio photo lands */}
          <div className="relative">
            <Blob size={340} color="var(--surface-variant)" style={{ left: -40, top: 20, opacity: 0.8 }} />
            <div
              className="relative z-[1] aspect-[4/5] overflow-hidden rounded-[var(--radius-xl)] shadow-ambient-lg bg-surface-container"
              style={{ transform: "rotate(-1deg)" }}
            >
              <Image
                src="/paintings/placeholder-3.svg"
                alt="Barbara J Demers in the studio"
                fill
                sizes="(min-width: 768px) 40vw, 90vw"
                className="object-cover"
              />
              <ArtistNote
                icon="✏️"
                className="absolute bottom-5 left-5 shadow-ambient"
              >
                Studio photo coming soon
              </ArtistNote>
            </div>
          </div>

          {/* First-person copy */}
          <div className="flex flex-col gap-6">
            <p className="text-[19px] leading-[1.7] text-on-surface-muted text-pretty">
              I work in oil — mostly on linen, sometimes on panel when I want
              the surface to stay smooth. Thin glazes over a warm
              underpainting, worked up over a few weeks. I paint from my own
              reference photos and, when I can, from life.
            </p>
            <p className="text-[19px] leading-[1.7] text-on-surface-muted text-pretty">
              What I care about is the <em className="not-italic font-semibold text-on-surface">personality</em>:
              the specific tilt of a head, the way a dog&rsquo;s eyebrow
              decides what it&rsquo;s feeling, the exact place a cat loses
              focus. I don&rsquo;t trust a portrait that could be anyone.
            </p>

            <blockquote
              className="self-start rounded-[28px] bg-primary-container-dim text-on-primary-container px-7 py-6 max-w-md font-serif italic text-xl leading-snug"
              style={{ transform: "rotate(-1deg)" }}
            >
              &ldquo;The best compliment I get is &lsquo;that&rsquo;s exactly
              how he sits.&rsquo;&rdquo;
            </blockquote>
          </div>
        </div>
      </Section>

      {/* PROCESS — reused from landing, same four steps */}
      <Section tone="low" pad="lg">
        <div className="max-w-2xl mb-14">
          <Eyebrow>How a commission unfolds</Eyebrow>
          <h2 className="mt-4 font-serif text-4xl md:text-5xl leading-[1.08] tracking-[-0.015em]">
            Four steps, one painting that looks like them.
          </h2>
        </div>
        <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {PROCESS_STEPS.map((step, i) => (
            <li
              key={step.title}
              className="rounded-[var(--radius-lg)] bg-surface-container-lowest p-7 shadow-ambient-sm"
            >
              <div className="font-serif italic text-5xl text-primary leading-none">
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="mt-5 font-serif text-2xl leading-tight text-on-surface">
                {step.title}
              </h3>
              <p className="mt-3 text-[15px] text-on-surface-muted leading-relaxed">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      {/* WHERE + CLOSING */}
      <Section tone="surface" pad="lg">
        <div className="grid gap-12 md:grid-cols-[1fr_1.2fr] items-start">
          <div>
            <Eyebrow>Where the studio is</Eyebrow>
            <h2 className="mt-4 font-serif text-3xl md:text-4xl leading-tight">
              A small room at the back of a big garden.
            </h2>
            <p className="mt-5 text-[17px] leading-relaxed text-on-surface-muted">
              The studio is in the north-east United States, full of
              north-facing light in the morning and west-facing light at the
              end of the day. Every painting you&rsquo;ve seen on this site
              was made there. If you&rsquo;d like to visit, ask — I&rsquo;m
              occasionally around on weekends.
            </p>
          </div>

          <div className="rounded-[var(--radius-lg)] bg-surface-container p-8 md:p-10">
            <Eyebrow>Thinking about a commission?</Eyebrow>
            <h3 className="mt-4 font-serif text-2xl md:text-3xl leading-tight">
              The conversation starts with a few photos and a note.
            </h3>
            <p className="mt-4 text-[15px] text-on-surface-muted leading-relaxed">
              I take a handful of commissions a year so I can stay
              present on each one. Send me the silly photos, the
              serious photos, and the story — I&rsquo;ll write back.
            </p>
            <Link
              href="/commissions"
              className="mt-6 inline-flex items-center gap-2 font-medium text-primary hover:gap-3 transition-all"
            >
              Start a commission{" "}
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}

const PROCESS_STEPS = [
  {
    title: "Send me their photos",
    body: "Three or four favourites — the silly ones, the serious ones, the one where the light is perfect. I'll pick the reference together with you.",
  },
  {
    title: "We talk personality",
    body: "A short call so I can learn the story. What makes them them? What do you want the painting to remember?",
  },
  {
    title: "Oil on linen",
    body: "I build the painting up in thin glazes over a warm underpainting. You'll get progress photos at the block-in and finish stages.",
  },
  {
    title: "Shipped from the studio",
    body: "Packed by hand, insured, on its way within 4–6 weeks. A little thank-you note is already in the box.",
  },
];
