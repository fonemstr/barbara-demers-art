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
    body: "Animals captured in the seconds before they vanish — alert, present, fully themselves.",
    cta: "See the wild collection",
    href: "/gallery?group=wild",
    groups: ["wild", "bird"],
  },
  {
    slug: "pasture",
    title: "The Pasture",
    subhead: "Farm and field, soft-eyed and steady.",
    body: "Cows, horses, sheep, and barn cats — the quiet population of the rural everyday.",
    cta: "See the pasture collection",
    href: "/gallery?group=farm",
    groups: ["farm", "horse"],
  },
  {
    slug: "small-wonders",
    title: "Small Wonders",
    subhead: "The bees, butterflies, and tiny lives that hold a whole season.",
    body: "Studies of insects, blossoms, and small creatures — paintings of attention, of slowing down to look.",
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
            <Eyebrow>Original paintings</Eyebrow>
            <h1 className="font-serif text-5xl md:text-7xl leading-[1.05] tracking-[-0.02em] text-on-surface text-balance">
              Painted from a place of{" "}
              <em className="font-normal italic text-primary">wonder</em>.
            </h1>
            <p className="text-lg md:text-xl text-on-surface-muted max-w-xl leading-relaxed">
              Original oil paintings of the wild, the bucolic, and the small
              things easy to miss — each one a single piece, painted slowly in
              a light-filled Manitoba studio.
            </p>
            <div className="flex flex-wrap gap-4 mt-3">
              <ButtonLink href="/gallery" size="md">
                Browse the gallery
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
                <Eyebrow className="mb-2">Latest in the studio</Eyebrow>
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
              Three corners of the studio.
            </h2>
            <p className="mt-5 text-lg text-on-surface-muted leading-relaxed">
              The work tends to gather into themes. Step into whichever calls
              you in.
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
                      className={`relative aspect-[4/5] overflow-hidden rounded-[var(--radius-xl)] shadow-ambient ${
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
                Browse all originals →
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
          COMMISSIONS TEASER — small, present but not centered
          ============================================================ */}
      <section className="bg-surface-container-low py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <Eyebrow>Also available</Eyebrow>
          <h2 className="mt-4 font-serif text-3xl md:text-4xl leading-[1.1] tracking-[-0.015em]">
            Yes, I do commissions too.
          </h2>
          <p className="mt-5 text-lg text-on-surface-muted leading-relaxed">
            A small number of custom portraits each year, when the originals
            leave room for them.
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
          <ArtistNote icon="💌" rotate={1.5} className="mx-auto">
            Two emails a month, max.
          </ArtistNote>
          <h2 className="mt-6 font-serif text-4xl md:text-5xl leading-[1.08] tracking-[-0.015em]">
            Studio dispatches.
          </h2>
          <p className="mt-5 text-lg text-on-surface-muted">
            Quiet notes from the studio: new originals as they&rsquo;re
            finished, the occasional in-progress photo, and the rare
            commission opening.
          </p>
          <div className="mt-9 max-w-lg mx-auto">
            <NewsletterForm />
          </div>
        </div>
      </section>
    </div>
  );
}
