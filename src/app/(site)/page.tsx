import Link from "next/link";
import Image from "next/image";
import { getFeaturedPaintings, getAllPaintings } from "@/data/paintings";
import { PaintingCard } from "@/components/painting-card";
import { NewsletterForm } from "@/components/newsletter-form";
import { ArtistNote } from "@/components/ui/artist-note";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ButtonLink } from "@/components/ui/button";
import { Blob } from "@/components/ui/blob";

// Re-generate at most once a minute so new paintings added in admin appear
// (hero, testimonial image, latest row) without a redeploy.
export const revalidate = 60;

export default async function HomePage() {
  const featured = await getFeaturedPaintings(3);
  const all = await getAllPaintings();
  // Hero uses the first featured (or first non-sold) painting as the big image.
  const hero = featured[0] ?? all.find((p) => !p.sold) ?? all[0];
  // Testimonial / "Lover first" block uses the next visually strong painting.
  const testimonialImg = featured[1]?.images[0] ?? hero?.images[0];

  return (
    <div className="overflow-hidden">
      {/* ============================================================
          HERO — asymmetric grid, overlapping mini-card, organic blobs
          ============================================================ */}
      <section className="relative mx-auto max-w-6xl px-6 pt-20 pb-28">
        <Blob size={460} color="var(--surface-variant)" style={{ left: -140, top: -40 }} />
        <Blob size={220} color="var(--secondary-container)" style={{ right: 80, top: 60, opacity: 0.5 }} />

        <div className="relative z-10 grid gap-16 md:grid-cols-[1.1fr_1fr] items-center">
          {/* Copy column */}
          <div className="flex flex-col gap-7">
            <ArtistNote>Artist&rsquo;s Note: Every whisker tells a story.</ArtistNote>
            <h1 className="font-serif text-5xl md:text-7xl leading-[1.05] tracking-[-0.02em] text-on-surface text-balance">
              Capturing the{" "}
              <em className="font-normal italic text-primary">wags</em>, purrs,
              and head-tilts of your best friends.
            </h1>
            <p className="text-lg md:text-xl text-on-surface-muted max-w-xl leading-relaxed">
              Custom fine-art portraits that celebrate the goofy grins, soulful
              stares, and unique personalities of the animals who share our
              homes.
            </p>
            <div className="flex flex-wrap gap-4 mt-3">
              <ButtonLink href="/commissions" size="md">
                Commission Your Portrait
              </ButtonLink>
              <ButtonLink href="/gallery" size="md" variant="secondary">
                View the Zoo
              </ButtonLink>
            </div>
          </div>

          {/* Hero image with overlapping mini-card */}
          {hero && (
            <div className="relative self-stretch min-h-[520px]">
              <Blob size={380} color="var(--surface-container-highest)" style={{ right: -40, top: 60 }} />
              <div className="relative z-[1] ml-auto w-[92%] aspect-[4/5] max-h-[560px] overflow-hidden rounded-[var(--radius-xl)] shadow-lifted">
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
          GALLERY OF PERSONALITIES — layered-paper section
          ============================================================ */}
      {featured.length > 0 && (
        <section className="bg-surface-container-low py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex items-end justify-between mb-14">
              <div className="max-w-xl">
                <Eyebrow>Gallery of Personalities</Eyebrow>
                <h2 className="mt-4 font-serif text-4xl md:text-5xl leading-[1.08] tracking-[-0.015em] text-on-surface">
                  Currently in the studio
                </h2>
              </div>
              <Link
                href="/gallery"
                className="text-sm text-on-surface-muted hover:text-on-surface underline underline-offset-[6px] decoration-on-surface-faint"
              >
                See all work →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {featured.map((painting) => (
                <PaintingCard key={painting.slug} painting={painting} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================================================
          LOVER FIRST, ARTIST SECOND — testimonial block with rotated note
          ============================================================ */}
      <section className="relative mx-auto max-w-6xl px-6 py-28">
        <div className="grid gap-16 md:grid-cols-[1fr_1.05fr] items-center">
          {/* Image side */}
          {testimonialImg && (
            <div className="relative">
              <Blob size={320} color="var(--surface-variant)" style={{ left: -60, top: 40, opacity: 0.6 }} />
              <div className="relative z-[1] aspect-[5/6] overflow-hidden rounded-[var(--radius-xl)] shadow-ambient-lg">
                <Image
                  src={testimonialImg}
                  alt="A painting in progress"
                  fill
                  sizes="(min-width: 768px) 45vw, 90vw"
                  className="object-cover"
                />
              </div>
            </div>
          )}

          {/* Copy side */}
          <div className="flex flex-col gap-7">
            <Eyebrow>A lover first, an artist second</Eyebrow>
            <h2 className="font-serif text-4xl md:text-5xl leading-[1.08] tracking-[-0.015em]">
              I paint the animals I&rsquo;d want to share a couch with.
            </h2>
            <p className="text-lg text-on-surface-muted leading-relaxed">
              Every portrait starts with three or four photos and a long phone
              call. I want to know the rescue story, the bad-habit quirks, and
              the exact sound they make when they hear the treat jar open. The
              paint comes second.
            </p>
            <div
              className="self-start rounded-[28px] bg-primary-container-dim text-on-primary-container px-7 py-5 max-w-md"
              style={{ transform: "rotate(-1.2deg)" }}
            >
              <p className="font-serif italic text-xl leading-snug">
                &ldquo;She captured Biscuit&rsquo;s eyebrows so perfectly I
                cried. I cried! Over eyebrows!&rdquo;
              </p>
              <p className="mt-3 text-sm font-medium">— Maren, Portland</p>
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
        </div>
      </section>

      {/* ============================================================
          JOIN THE PACK — newsletter
          ============================================================ */}
      <section className="relative mx-auto max-w-3xl px-6 py-28 text-center">
        <Blob size={260} color="var(--secondary-container)" style={{ left: "50%", top: 0, transform: "translateX(-50%)", opacity: 0.4 }} />
        <div className="relative z-10">
          <ArtistNote icon="💌" rotate={1.5} className="mx-auto">
            Two emails a month, max.
          </ArtistNote>
          <h2 className="mt-6 font-serif text-4xl md:text-5xl leading-[1.08] tracking-[-0.015em]">
            Join the pack.
          </h2>
          <p className="mt-5 text-lg text-on-surface-muted">
            Occasional notes from the easel — new paintings, commissions
            reopening, and the occasional progress photo.
          </p>
          <div className="mt-9 max-w-lg mx-auto">
            <NewsletterForm />
          </div>
        </div>
      </section>
    </div>
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
