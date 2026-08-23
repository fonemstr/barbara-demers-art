import Image from "next/image";
import { getFeaturedPaintings, getAllPaintings } from "@/data/paintings";
import { getCommissionedPortraits } from "@/data/commissioned-portraits";
import { CommissionsForm } from "@/components/commissions-form";
import { CommissionDeposit } from "@/components/commission-deposit";
import { CommissionsFAQ } from "@/components/commissions-faq";
import { Section } from "@/components/ui/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ArtistNote } from "@/components/ui/artist-note";
import { ButtonLink } from "@/components/ui/button";
import { Blob } from "@/components/ui/blob";

export const metadata = { title: "Commissions" };

// Re-generate at most once a minute so a new "currently on the easel" image
// can pick up admin changes without a redeploy.
export const revalidate = 60;

const PROCESS_STEPS = [
  {
    title: "Send me their photos",
    body: "Share a few strong reference photos and the story of the animal. Barbara will look for the image with the most presence and feeling.",
  },
  {
    title: "We plan it together",
    body: "Barbara replies personally to every inquiry. Together you'll settle on the size, the reference photo, and the timeline before any deposit is taken.",
  },
  {
    title: "Expressive realism",
    body: "The painting stays rooted in likeness, but Barbara uses color, gesture, and symbolic choices to move beyond the photo mold.",
  },
  {
    title: "Shipped from the studio",
    body: "Packed by hand, insured, on its way within 4–6 weeks. A little thank-you note is already in the box.",
  },
];

export default async function CommissionsPage() {
  const featured = await getFeaturedPaintings(3);
  const all = await getAllPaintings();
  const portraits = await getCommissionedPortraits();
  const hero = featured[0] ?? all.find((p) => !p.sold) ?? all[0];
  const testimonialImg = featured[1]?.images[0] ?? hero?.images[0];

  return (
    <div className="overflow-hidden">
      {/* ============================================================
          HERO — moved from former home page; commissions-focused
          ============================================================ */}
      <section className="relative mx-auto max-w-6xl px-6 pt-20 pb-28">
        <Blob size={460} color="var(--surface-variant)" style={{ left: -140, top: -40 }} />
        <Blob size={220} color="var(--secondary-container)" style={{ right: 80, top: 60, opacity: 0.5 }} />

        <div className="relative z-10 grid gap-16 md:grid-cols-[1.1fr_1fr] items-center">
          {/* Copy column */}
          <div className="flex flex-col gap-7">
            <ArtistNote icon="✉️">
              Now accepting commissions.
            </ArtistNote>
            <h1 className="font-serif text-3xl md:text-5xl leading-[1.1] tracking-[-0.015em] text-on-surface text-balance">
              Custom work in the spirit of Barbara&apos;s{" "}
              <em className="font-normal italic text-primary">originals</em>.
            </h1>
            <p className="text-lg md:text-xl text-on-surface-muted max-w-xl leading-relaxed">
              Barbara now paints full time, and commissions are a central
              part of the studio. Tell her about the animal you love and
              she&apos;ll bring that presence to canvas in her expressive
              realism style.
            </p>
            <div className="flex flex-wrap gap-4 mt-3">
              <ButtonLink href="#inquiry" size="md">
                Start your inquiry
              </ButtonLink>
              <ButtonLink href="/gallery" size="md" variant="secondary">
                View available work
              </ButtonLink>
            </div>
          </div>

          {/* Hero image with overlapping mini-card */}
          {hero && (
            <div className="relative self-stretch min-h-[520px]">
              <Blob size={380} color="var(--surface-container-highest)" style={{ right: -40, top: 60 }} />
              <div className="relative z-[1] ml-auto w-[92%] aspect-[4/5] max-h-[560px] overflow-hidden shadow-lifted">
                <Image
                  src={hero.images[0]}
                  alt={hero.title}
                  fill
                  priority
                  sizes="(min-width: 768px) 40vw, 90vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute left-[-20px] bottom-10 z-[2] bg-surface-container-lowest rounded-[32px] p-5 pr-7 shadow-ambient max-w-[260px]">
                <Eyebrow className="mb-2">Currently on the easel</Eyebrow>
                <p className="font-serif text-lg leading-tight text-on-surface">
                  {hero.title}
                </p>
                <p className="text-sm text-on-surface-muted mt-1">
                  {hero.medium}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================
          COMMISSION PHILOSOPHY
          ============================================================ */}
      <section className="relative mx-auto max-w-6xl px-6 py-28">
        <div className="grid gap-16 md:grid-cols-[1fr_1.05fr] items-center">
          {testimonialImg && (
            <div className="relative">
              <Blob size={320} color="var(--surface-variant)" style={{ left: -60, top: 40, opacity: 0.6 }} />
              <div className="relative z-[1] aspect-[5/6] overflow-hidden shadow-ambient-lg">
                <Image
                  src={testimonialImg}
                  alt="A commission in progress"
                  fill
                  sizes="(min-width: 768px) 45vw, 90vw"
                  className="object-cover"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-7">
            <Eyebrow>Before you inquire</Eyebrow>
            <h2 className="font-serif text-4xl md:text-5xl leading-[1.08] tracking-[-0.015em]">
              A commission should still feel like Barbara&apos;s work.
            </h2>
            <p className="text-lg text-on-surface-muted leading-relaxed">
              The strongest commissions begin with trust in Barbara&apos;s eye:
              bold color, expressive realism, and a desire to reveal the living
              presence of the animal rather than simply copy a photograph.
            </p>
            <div
              className="self-start rounded-[28px] bg-primary-container-dim text-on-primary-container px-7 py-5 max-w-md"
            >
              <p className="font-serif italic text-xl leading-snug">
                &ldquo;The goal is not a static likeness. The goal is a living
                presence.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          PROCESS — 4 steps on a layered surface
          ============================================================ */}
      <section className="bg-surface-container-low py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl mb-14">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-4 font-serif text-4xl md:text-5xl leading-[1.08] tracking-[-0.015em]">
              Four steps, one painting with presence.
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
        </div>
      </section>

      {/* ============================================================
          PAST COMMISSIONS — delivered portraits with owner comments.
          Hidden until the first entry is added in the admin.
          ============================================================ */}
      {portraits.length > 0 && (
        <Section tone="surface" pad="lg">
          <div className="max-w-2xl mb-14">
            <Eyebrow>Past commissions</Eyebrow>
            <h2 className="mt-4 font-serif text-4xl md:text-5xl leading-[1.08] tracking-[-0.015em]">
              Portraits that found their way home.
            </h2>
            <p className="mt-5 text-lg text-on-surface-muted leading-relaxed">
              Every commission starts as someone&apos;s story about an animal
              they love. A few of those paintings, and what their owners said
              when they arrived.
            </p>
          </div>
          <div className="grid gap-10 md:grid-cols-2 lg:gap-14">
            {portraits.map((portrait) => {
              const meta = [
                portrait.subject,
                portrait.medium,
                portrait.widthIn && portrait.heightIn
                  ? `${portrait.widthIn}×${portrait.heightIn} in`
                  : undefined,
                portrait.year ? String(portrait.year) : undefined,
              ]
                .filter(Boolean)
                .join(" · ");
              const attribution = [portrait.ownerName, portrait.ownerLocation]
                .filter(Boolean)
                .join(", ");
              return (
                <figure
                  key={portrait.id}
                  className="bg-surface-container-lowest rounded-[var(--radius-lg)] overflow-hidden shadow-ambient-sm"
                >
                  <div className="relative aspect-[4/3] bg-surface-container">
                    <Image
                      src={portrait.images[0]}
                      alt={`${portrait.title}${portrait.subject ? ` — commissioned portrait of a ${portrait.subject.toLowerCase()}` : " — commissioned portrait"}`}
                      fill
                      sizes="(min-width: 768px) 45vw, 90vw"
                      className="object-cover"
                    />
                  </div>
                  <figcaption className="p-7 md:p-8">
                    <h3 className="font-serif text-2xl leading-tight text-on-surface">
                      {portrait.title}
                    </h3>
                    {meta && (
                      <p className="mt-1.5 text-sm text-on-surface-subtle">
                        {meta}
                      </p>
                    )}
                    {portrait.ownerQuote && (
                      <blockquote className="mt-5 font-serif italic text-lg leading-relaxed text-on-surface-muted">
                        &ldquo;{portrait.ownerQuote}&rdquo;
                        {attribution && (
                          <cite className="mt-3 block text-sm not-italic font-sans text-on-surface-subtle">
                            — {attribution}
                          </cite>
                        )}
                      </blockquote>
                    )}
                  </figcaption>
                </figure>
              );
            })}
          </div>
          <div className="mt-14 text-center">
            <ButtonLink href="#inquiry" size="md" variant="secondary">
              Start your own commission
            </ButtonLink>
          </div>
        </Section>
      )}

      {/* ============================================================
          FORM + TRUST PANEL
          ============================================================ */}
      <Section tone="low" pad="lg" className="overflow-hidden">
        <div id="inquiry" className="grid gap-12 lg:grid-cols-[1.4fr_1fr] items-start scroll-mt-24">
          <div className="rounded-[var(--radius-lg)] bg-surface-container-lowest p-8 md:p-10 shadow-ambient-sm">
            <Eyebrow>Start the conversation</Eyebrow>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl leading-tight">
              Tell me about the animal.
            </h2>
            <p className="mt-3 text-on-surface-muted leading-relaxed">
              Share the story, the reference photos, and what draws you to
              Barbara&apos;s way of painting. If the project feels like a fit,
              she&rsquo;ll write back with next steps.
            </p>
            <div className="mt-8">
              <CommissionsForm />
            </div>
          </div>

          <aside className="flex flex-col gap-8 lg:sticky lg:top-28">
            <div className="rounded-[var(--radius-md)] bg-surface-container p-6">
              <p className="font-serif text-lg text-on-surface leading-tight">
                What&rsquo;s included
              </p>
              <ul className="mt-3 flex flex-col gap-2 text-[14px] text-on-surface-muted leading-relaxed">
                <li>· An original expressive realism painting</li>
                <li>· Medium and surface chosen to suit the piece</li>
                <li>· Progress photos during the painting process</li>
                <li>· Insured shipping, packed by hand</li>
                <li>· A handwritten note in the box</li>
              </ul>
            </div>
          </aside>
        </div>
      </Section>

      {/* ============================================================
          DEPOSIT — step two, after Barbara says yes
          ============================================================ */}
      <Section tone="surface" pad="lg">
        <div id="deposit" className="grid gap-12 lg:grid-cols-[1fr_1.4fr] items-start scroll-mt-24">
          <div>
            <Eyebrow>Already heard back from Barbara?</Eyebrow>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl leading-tight">
              Reserve your spot on the schedule.
            </h2>
            <p className="mt-4 text-on-surface-muted leading-relaxed">
              Once Barbara has said yes to your commission and confirmed the
              size and price, a deposit locks in your place. It counts toward
              the final price, and the balance is due when the painting is
              finished — before it ships.
            </p>
            <p className="mt-3 text-sm text-on-surface-subtle leading-relaxed">
              Haven&rsquo;t written yet? Start with the inquiry above.
              Barbara replies to every request and confirms each project
              personally before a deposit is taken.
            </p>
          </div>
          <div className="rounded-[var(--radius-lg)] bg-surface-container-low p-8 md:p-10">
            <CommissionDeposit />
          </div>
        </div>
      </Section>

      {/* ============================================================
          FAQ
          ============================================================ */}
      <Section tone="low" pad="lg">
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
    </div>
  );
}
