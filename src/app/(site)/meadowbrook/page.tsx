import Image from "next/image";
import Link from "next/link";
import { getMeadowbrookPaintings } from "@/data/paintings";
import { formatPrice, lowestPrintPriceCents } from "@/lib/utils";
import { NewsletterForm } from "@/components/newsletter-form";
import { Section } from "@/components/ui/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ArtistNote } from "@/components/ui/artist-note";
import { Chip } from "@/components/ui/chip";
import { Blob } from "@/components/ui/blob";

export const metadata = {
  title: "The Residents of Meadowbrook",
  description:
    "A growing series of 5×5 inch original character portraits — the animal residents of Meadowbrook, a village rooted in kindness. Collect them all and build the village.",
  openGraph: {
    type: "website",
    siteName: "Barbara J Demers",
    title: "The Residents of Meadowbrook",
    description:
      "A growing series of 5×5 inch original character portraits — the animal residents of Meadowbrook, a village rooted in kindness.",
    images: [
      {
        url: "/meadowbrook/seal.webp",
        alt: "The Meadowbrook village seal — an oak tree, rooted in kindness",
      },
    ],
  },
};

// New residents arrive via the admin; refresh often enough that the
// village grows without a redeploy.
export const revalidate = 60;

const SERIES_MARKS = [
  "Simple compositions",
  "One character",
  "One object",
  "Warm, natural light",
  "Expressive personality",
];

export default async function MeadowbrookPage() {
  const residents = await getMeadowbrookPaintings();

  return (
    <div className="overflow-hidden">
      {/* HERO — the village seal and introduction */}
      <Section tone="surface" pad="lg" className="overflow-hidden">
        <Blob size={420} color="var(--surface-variant)" style={{ left: -120, top: -40, opacity: 0.7 }} />
        <Blob size={240} color="var(--secondary-container)" style={{ right: 40, top: 120, opacity: 0.5 }} />
        <div className="relative z-10 grid gap-12 md:grid-cols-[0.85fr_1.15fr] items-center">
          {/* The village seal */}
          <div className="relative mx-auto w-[240px] sm:w-[300px] md:w-[380px]">
            <Blob
              size={340}
              color="var(--surface-container-highest)"
              style={{ left: -50, bottom: -40, opacity: 0.8 }}
            />
            <div className="relative z-[1] aspect-square overflow-hidden rounded-full shadow-lifted bg-surface-container-lowest">
              <Image
                src="/meadowbrook/seal.webp"
                alt="The Meadowbrook village seal — a great oak over the motto: rooted in kindness, a village where every resident matters"
                fill
                priority
                sizes="(min-width: 768px) 380px, (min-width: 640px) 300px, 240px"
                className="object-cover scale-[1.04]"
              />
            </div>
          </div>

          {/* The introduction */}
          <div className="flex flex-col gap-6 text-center md:text-left items-center md:items-start">
            <ArtistNote icon="🏡">
              A new collection, one resident at a time.
            </ArtistNote>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-[-0.02em] text-balance">
              The Residents of{" "}
              <em className="font-normal italic text-primary">Meadowbrook</em>
            </h1>
            <p className="font-serif italic text-xl md:text-2xl text-primary leading-snug text-balance">
              Rooted in kindness — a village where every resident matters.
            </p>
            <p className="text-lg text-on-surface-muted leading-relaxed text-pretty">
              Somewhere past the last fence post, Meadowbrook&rsquo;s
              residents are arriving one small painting at a time. Each
              portrait is an original 5×5 inch painting introducing one
              character, their trade, and the object they&rsquo;re never
              seen without.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              {SERIES_MARKS.map((mark) => (
                <Chip key={mark}>{mark}</Chip>
              ))}
            </div>
            <p className="text-sm text-on-surface-subtle">
              Originals $95–$125 · prints of every resident · collect them
              all and build the village
            </p>
          </div>
        </div>
      </Section>

      {/* RESIDENTS — the growing village grid */}
      <Section tone="low" pad="lg">
        <div className="flex items-end justify-between mb-10">
          <div>
            <Eyebrow>The village so far</Eyebrow>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl leading-[1.1] tracking-[-0.015em]">
              {residents.length > 0
                ? `${residents.length} resident${residents.length === 1 ? "" : "s"} and counting.`
                : "The first residents are moving in."}
            </h2>
          </div>
        </div>

        {residents.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {residents.map((p) => {
              const printsFrom = lowestPrintPriceCents(p);
              return (
                <Link key={p.slug} href={`/gallery/${p.slug}`} className="group block">
                  <div className="relative aspect-square overflow-hidden bg-surface-container shadow-ambient">
                    <Image
                      src={p.images[0]}
                      alt={p.characterName ? `${p.characterName}, ${p.characterRole ?? "resident of Meadowbrook"}` : p.title}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                      className="object-cover transition-transform duration-[700ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.03]"
                    />
                    {p.sold && (
                      <div className="absolute top-3 right-3 bg-on-surface/90 text-surface text-[10px] tracking-[0.18em] uppercase px-2.5 py-1 rounded-full backdrop-blur-sm">
                        Found a home
                      </div>
                    )}
                  </div>
                  <div className="mt-4 text-center">
                    <h3 className="font-serif text-xl leading-tight text-on-surface">
                      {p.characterName ?? p.title}
                    </h3>
                    {p.characterRole && (
                      <p className="text-sm italic text-on-surface-muted mt-1">
                        {p.characterRole}
                      </p>
                    )}
                    <p className="text-sm text-on-surface-subtle mt-2 tabular-nums">
                      {p.sold
                        ? printsFrom !== undefined
                          ? `Prints from ${formatPrice(printsFrom)}`
                          : "Original sold"
                        : formatPrice(p.priceCents)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[var(--radius-lg)] bg-surface-container-lowest p-10 text-center max-w-2xl mx-auto">
            <p className="font-serif text-2xl text-on-surface">
              Barbara is painting the first portraits now.
            </p>
            <p className="mt-3 text-on-surface-muted leading-relaxed">
              The rooster, the pie maker, the night watchman — the first
              residents are on the easel. Join the newsletter below and
              you&rsquo;ll meet each one the day they arrive.
            </p>
          </div>
        )}
      </Section>

      {/* NEWSLETTER — meet each new arrival */}
      <Section tone="surface" pad="lg" maxWidth="3xl">
        <div className="text-center mb-8">
          <Eyebrow>Meet the next resident first</Eyebrow>
          <h2 className="mt-3 font-serif text-3xl md:text-4xl leading-tight">
            New arrivals, straight to your inbox.
          </h2>
          <p className="mt-4 text-on-surface-muted leading-relaxed max-w-xl mx-auto">
            Each portrait introduces a new resident of Meadowbrook — and the
            originals tend to find homes quickly. Newsletter readers meet
            every new arrival before anyone else.
          </p>
        </div>
        <NewsletterForm />
      </Section>
    </div>
  );
}
