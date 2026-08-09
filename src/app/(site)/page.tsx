import Link from "next/link";
import Image from "next/image";
import {
  getAllPaintings,
  getFeaturedPaintings,
  type Painting,
  type SubjectGroup,
} from "@/data/paintings";
import { PaintingCard } from "@/components/painting-card";
import { NewsletterForm } from "@/components/newsletter-form";
import { ArtistNote } from "@/components/ui/artist-note";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ButtonLink } from "@/components/ui/button";
import { Blob } from "@/components/ui/blob";

export const revalidate = 60;

type Collection = {
  slug: string;
  title: string;
  subhead: string;
  body: string;
  cta: string;
  href: string;
  // Subject groups whose paintings can stand in as the block's hero image.
  groups: SubjectGroup[];
};

const COLLECTIONS: Collection[] = [
  {
    slug: "wild",
    title: "The Wild",
    subhead: "Foxes, hawks, the watchful in-between.",
    body: "Wild beings held in the charged second before they vanish — alert, present, and fully themselves.",
    cta: "See the wild collection",
    href: "/gallery?group=wild",
    groups: ["wild", "bird"],
  },
  {
    slug: "pasture",
    title: "The Pasture",
    subhead: "Farm and field, soft-eyed and steady.",
    body: "Cows, horses, sheep, and the animals of rural life — seen with the dignity and presence usually reserved for companions.",
    cta: "See the pasture collection",
    href: "/gallery?group=farm",
    groups: ["farm", "horse"],
  },
  {
    slug: "small-wonders",
    title: "Small Wonders",
    subhead: "The bees, butterflies, and tiny lives that hold a whole season.",
    body: "Insects, blossoms, and small creatures painted as lives worth noticing — tiny presences that hold entire seasons together.",
    cta: "See the small wonders collection",
    href: "/gallery?group=other",
    groups: ["other"],
  },
];

function pickHeroForCollection(
  paintings: Painting[],
  collection: Collection
): Painting | undefined {
  const inGroup = paintings.filter((p) =>
    collection.groups.includes(p.subjectGroup)
  );
  return inGroup.find((p) => p.featured && !p.sold) ?? inGroup[0];
}

export default async function HomePage() {
  const featured = await getFeaturedPaintings(4);
  const all = await getAllPaintings();
  const hero = featured[0] ?? all.find((p) => !p.sold) ?? all[0];

  return (
    <div className="overflow-hidden">
      {/* ============================================================
          HERO — brand statement, originals-first
          ============================================================ */}
      <section className="relative mx-auto max-w-6xl px-6 pt-20 pb-28">
        <Blob size={460} color="var(--surface-variant)" style={{ left: -140, top: -40 }} />
        <Blob size={220} color="var(--secondary-container)" style={{ right: 80, top: 60, opacity: 0.5 }} />

        <div className="relative z-10 grid gap-16 md:grid-cols-[1.1fr_1fr] items-center">
          {/* Copy column */}
          <div className="flex flex-col gap-7">
            <Eyebrow>Original expressive realism paintings</Eyebrow>
            <h1 className="font-serif text-5xl md:text-7xl leading-[1.05] tracking-[-0.02em] text-on-surface text-balance">
              Original paintings that ask us to{" "}<br className="hidden sm:block" />
              <em className="font-normal italic text-primary">look again</em>.
            </h1>
            <p className="text-lg md:text-xl text-on-surface-muted max-w-xl leading-relaxed">
              Barbara J Demers creates paintings of animals, insects, and the
              natural world using bold color, symbolic detail, and narrative
              titles to reveal the living presence in every being.
            </p>
            <div className="flex flex-wrap gap-4 mt-3">
              <ButtonLink href="/gallery" size="md">
                View available work
              </ButtonLink>
              <ButtonLink href="/blog" size="md" variant="secondary">
                Read the journal
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
                <Eyebrow className="mb-2">Original from the studio</Eyebrow>
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
          EDITORIAL COLLECTIONS — three themed blocks
          ============================================================ */}
      <section className="bg-surface-container-low py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl mb-14">
            <Eyebrow>Collections</Eyebrow>
            <h2 className="mt-4 font-serif text-4xl md:text-5xl leading-[1.08] tracking-[-0.015em]">
              Three ways of looking closer.
            </h2>
            <p className="mt-5 text-lg text-on-surface-muted leading-relaxed">
              The work gathers around lives we often pass too quickly: the
              wild, the pasture, and the small wonders underfoot.
            </p>
          </div>

          <div className="flex flex-col gap-10">
            {COLLECTIONS.map((collection, idx) => {
              const heroPainting = pickHeroForCollection(all, collection);
              const reverse = idx % 2 === 1;
              return (
                <article
                  key={collection.slug}
                  className="grid gap-10 md:grid-cols-2 items-center bg-surface-container-lowest rounded-[var(--radius-lg)] p-6 md:p-10 shadow-ambient-sm"
                >
                  {heroPainting && (
                    <Link
                      href={collection.href}
                      className={`relative aspect-[4/5] overflow-hidden shadow-ambient ${
                        reverse ? "md:order-2" : ""
                      }`}
                      aria-label={collection.cta}
                    >
                      <Image
                        src={heroPainting.images[0]}
                        alt={heroPainting.title}
                        fill
                        sizes="(min-width: 768px) 45vw, 90vw"
                        className="object-cover transition-transform duration-[700ms] ease-[cubic-bezier(.22,1,.36,1)] hover:scale-[1.03]"
                      />
                    </Link>
                  )}
                  <div className="flex flex-col gap-5">
                    <Eyebrow>{collection.subhead}</Eyebrow>
                    <h3 className="font-serif text-3xl md:text-4xl leading-tight text-on-surface">
                      {collection.title}
                    </h3>
                    <p className="text-on-surface-muted leading-relaxed">
                      {collection.body}
                    </p>
                    <Link
                      href={collection.href}
                      className="self-start text-sm font-medium text-on-surface underline underline-offset-[6px] decoration-on-surface-faint hover:decoration-on-surface"
                    >
                      {collection.cta} →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          BUDDERLEE — the village seal and an invitation to visit
          ============================================================ */}
      <section className="relative py-24 overflow-hidden">
        <Blob size={380} color="var(--secondary-container)" style={{ right: -120, top: 40, opacity: 0.4 }} />
        <div className="relative z-10 mx-auto max-w-6xl px-6 grid gap-12 md:grid-cols-[0.8fr_1.2fr] items-center">
          <div className="relative mx-auto w-[220px] sm:w-[280px] md:w-[340px]">
            <Blob
              size={300}
              color="var(--surface-container-highest)"
              style={{ left: -40, bottom: -30, opacity: 0.8 }}
            />
            <Link
              href="/budderlee"
              aria-label="Visit the Residents of Budderlee"
              className="relative z-[1] block aspect-square overflow-hidden rounded-full shadow-lifted bg-surface-container-lowest"
            >
              <Image
                src="/budderlee/seal.webp"
                alt="The Budderlee village seal — a great oak over the motto: rooted in kindness, a village where every resident matters"
                fill
                sizes="(min-width: 768px) 340px, (min-width: 640px) 280px, 220px"
                className="object-cover scale-[1.04] transition-transform duration-[700ms] ease-[cubic-bezier(.22,1,.36,1)] hover:scale-[1.08]"
              />
            </Link>
          </div>
          <div className="flex flex-col gap-6 text-center md:text-left items-center md:items-start">
            <Eyebrow>A village is growing</Eyebrow>
            <h2 className="font-serif text-4xl md:text-5xl leading-[1.08] tracking-[-0.015em] text-on-surface">
              The Residents of{" "}
              <em className="font-normal italic text-primary">Budderlee</em>.
            </h2>
            <p className="font-serif italic text-lg md:text-xl text-primary leading-snug">
              Rooted in kindness — a village where every resident matters.
            </p>
            <p className="text-lg text-on-surface-muted leading-relaxed max-w-xl">
              A growing series of 5×5 inch original character portraits.
              Each painting introduces one animal resident of Budderlee,
              their trade, and the object they&apos;re never seen without.
              Collect them all and build the village.
            </p>
            <div className="mt-2">
              <ButtonLink href="/budderlee" size="md">
                Meet the residents
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          FEATURED ORIGINALS — fresh-from-the-easel strip
          ============================================================ */}
      {featured.length > 0 && (
        <section className="py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex items-end justify-between mb-14">
              <div className="max-w-xl">
                <Eyebrow>Fresh from the easel</Eyebrow>
                <h2 className="mt-4 font-serif text-4xl md:text-5xl leading-[1.08] tracking-[-0.015em] text-on-surface">
                  New originals in the studio.
                </h2>
              </div>
              <Link
                href="/gallery"
                className="text-sm text-on-surface-muted hover:text-on-surface underline underline-offset-[6px] decoration-on-surface-faint"
              >
                Browse available work →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
              {featured.map((painting) => (
                <PaintingCard key={painting.slug} painting={painting} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================================================
          STUDIO ETHIC — values without turning the page into a lecture
          ============================================================ */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6 grid gap-10 md:grid-cols-[1fr_1.1fr] items-start">
          <div>
            <Eyebrow>How the paintings speak</Eyebrow>
            <h2 className="mt-4 font-serif text-4xl md:text-5xl leading-[1.08] tracking-[-0.015em] text-on-surface">
              Beyond the photo mold.
            </h2>
          </div>
          <div className="text-lg text-on-surface-muted leading-relaxed space-y-5">
            <p>
              Barbara describes her work as expressive realism. The animal,
              insect, or natural subject remains recognizable, but heightened
              color and symbolic choices carry the feeling beyond a literal
              reference.
            </p>
            <p>
              Each title is part of the painting&apos;s voice — an invitation to
              pause, look again, and recognize the heart that beats in all
              living beings.
            </p>
            <p className="rounded-[var(--radius-lg)] bg-primary-container-dim px-6 py-5 font-medium text-on-primary-container">
              10% of profits from every original painting are donated to animal
              welfare.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================
          COMMISSIONS TEASER — small, present but not centered
          ============================================================ */}
      <section className="bg-surface-container-low py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <Eyebrow>Also available</Eyebrow>
          <h2 className="mt-4 font-serif text-3xl md:text-4xl leading-[1.1] tracking-[-0.015em]">
            Selective commissions.
          </h2>
          <p className="mt-5 text-lg text-on-surface-muted leading-relaxed">
            Barbara occasionally accepts custom animal portraits when the
            subject, story, and timing feel aligned with the spirit of the
            studio.
          </p>
          <div className="mt-8">
            <ButtonLink href="/commissions" size="md" variant="secondary">
              Learn about commissions
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ============================================================
          NEWSLETTER — studio dispatches
          ============================================================ */}
      <section className="relative mx-auto max-w-3xl px-6 py-28 text-center">
        <Blob size={260} color="var(--secondary-container)" style={{ left: "50%", top: 0, transform: "translateX(-50%)", opacity: 0.4 }} />
        <div className="relative z-10">
          <ArtistNote icon="💌" className="mx-auto">
            Two emails a month, max.
          </ArtistNote>
          <h2 className="mt-6 font-serif text-4xl md:text-5xl leading-[1.08] tracking-[-0.015em]">
            Join the collector list.
          </h2>
          <p className="mt-5 text-lg text-on-surface-muted">
            First access to new originals, collection releases, the stories
            behind the paintings, and the occasional commission opening.
          </p>
          <div className="mt-9 max-w-lg mx-auto">
            <NewsletterForm />
          </div>
        </div>
      </section>
    </div>
  );
}
