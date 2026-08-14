import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { Eyebrow } from "@/components/ui/eyebrow";
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
            eyebrow="Expressive realism paintings"
            title={
              <>
                Painting the heart that beats
                <br /> in all living beings.
              </>
            }
            lede="Barbara J Demers creates original paintings of animals, insects, and the natural world — work shaped by bold color, symbolic detail, and narrative titles that invite the viewer to pause and look again."
          />
        </div>
      </Section>

      {/* STUDIO PORTRAIT + STATEMENT */}
      <Section tone="surface" pad="lg">
        <div className="grid gap-14 md:grid-cols-[0.9fr_1.1fr] items-center">
          <div className="relative">
            <Blob size={340} color="var(--surface-variant)" style={{ left: -40, top: 20, opacity: 0.8 }} />
            <div
              className="relative z-[1] aspect-square overflow-hidden rounded-[var(--radius-xl)] shadow-ambient-lg bg-surface-container"
              style={{ transform: "rotate(-1deg)" }}
            >
              <Image
                src="/studio/barbara-at-easel.png"
                alt="Barbara J Demers at her easel"
                fill
                sizes="(min-width: 768px) 40vw, 90vw"
                className="object-cover"
                priority
              />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <p className="text-[19px] leading-[1.7] text-on-surface-muted text-pretty">
              My work begins with observation, but I am not interested in simply
              recreating a photograph. I use unusual color, energy, and symbolic
              details to bring forward the feeling behind the image.
            </p>
            <p className="text-[19px] leading-[1.7] text-on-surface-muted text-pretty">
              I want each painting to make the viewer pause — to see the animal
              or insect not as a category, a number, a pest, a product, or a
              background detail, but as a living being with presence.
            </p>

            <blockquote
              className="self-start rounded-[28px] bg-primary-container-dim text-on-primary-container px-7 py-6 max-w-md font-serif italic text-xl leading-snug"
            >
              &ldquo;The title is where the painting speaks.&rdquo;
            </blockquote>
          </div>
        </div>
      </Section>

      {/* EXPRESSIVE REALISM */}
      <Section tone="low" pad="lg">
        <div className="grid gap-12 md:grid-cols-[0.9fr_1.1fr] items-start">
          <div>
            <Eyebrow>The style</Eyebrow>
            <h2 className="mt-4 font-serif text-4xl md:text-5xl leading-[1.08] tracking-[-0.015em]">
              Expressive realism.
            </h2>
          </div>
          <div className="space-y-5 text-[18px] leading-relaxed text-on-surface-muted">
            <p>
              Barbara describes her art as expressive realism. The subject stays
              recognizable, but the painting breaks from the photo mold through
              heightened color, movement, and emotional emphasis.
            </p>
            <p>
              The goal is not a static likeness. The goal is a living presence:
              a gaze, a gesture, a color choice, or a symbolic change that asks
              the viewer to feel something more.
            </p>
            <p>
              Barbara works primarily in acrylic and occasionally in oil,
              choosing the medium that best serves the feeling of the piece.
            </p>
          </div>
        </div>
      </Section>

      {/* TITLES + GIVING */}
      <Section tone="surface" pad="lg">
        <div className="grid gap-12 md:grid-cols-2 items-start">
          <div className="rounded-[var(--radius-lg)] bg-surface-container p-8 md:p-10">
            <Eyebrow>Narrative titles</Eyebrow>
            <h2 className="mt-4 font-serif text-3xl md:text-4xl leading-tight">
              Every title carries the feeling behind the painting.
            </h2>
            <p className="mt-5 text-[16px] leading-relaxed text-on-surface-muted">
              Titles such as <em>You Are Not a Number, You Are Love</em>, <em>Eyes of a Different You</em>, and <em>The Kindness of One</em> are not labels. They are part of the work — a doorway into the meaning of the image.
            </p>
          </div>

          <div className="rounded-[var(--radius-lg)] bg-primary-container-dim text-on-primary-container p-8 md:p-10">
            <Eyebrow>Art that gives back</Eyebrow>
            <h2 className="mt-4 font-serif text-3xl md:text-4xl leading-tight">
              10% of profits support animal welfare.
            </h2>
            <p className="mt-5 text-[16px] leading-relaxed">
              Because the work is rooted in care for living beings, 10% of
              profits from every original painting are donated to animal welfare.
            </p>
          </div>
        </div>
      </Section>

      {/* CLOSING */}
      <Section tone="low" pad="lg">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>Originals first</Eyebrow>
          <h2 className="mt-4 font-serif text-3xl md:text-4xl leading-tight">
            The studio centers on original work.
          </h2>
          <p className="mt-5 text-[17px] leading-relaxed text-on-surface-muted">
            Barbara paints full time, creating original expressive realism
            paintings. Commissions are a welcome part of the studio: if
            there&apos;s an animal you love, she&apos;d like to hear the story.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/gallery"
              className="btn-primary-face inline-flex items-center rounded-full px-6 py-3 text-sm font-semibold"
            >
              View available work
            </Link>
            <Link
              href="/commissions"
              className="inline-flex items-center rounded-full px-6 py-3 text-sm font-semibold bg-surface-container text-on-surface hover:bg-surface-container-high"
            >
              Ask about a commission
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
