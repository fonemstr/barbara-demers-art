import Image from "next/image";
import Link from "next/link";
import { getBudderleePaintings } from "@/data/paintings";
import { formatPrice, lowestPrintPriceCents } from "@/lib/utils";
import { BudderleeSeal } from "@/components/budderlee-seal";
import { NewsletterForm } from "@/components/newsletter-form";
import { Section } from "@/components/ui/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ArtistNote } from "@/components/ui/artist-note";
import { Chip } from "@/components/ui/chip";
import { Blob } from "@/components/ui/blob";
import { JsonLd } from "@/components/json-ld";
import { collectionGraph } from "@/lib/schema";

export const metadata = {
  title: "The Residents of Budderlee, Collectible Animal Paintings",
  alternates: { canonical: "/budderlee" },
  description:
    "A growing series of 5×5 inch original character portraits — the animal residents of Budderlee, a village rooted in kindness. Collect them all and build the village.",
  openGraph: {
    type: "website",
    siteName: "Barbara J Demers",
    title: "The Residents of Budderlee",
    description:
      "A growing series of 5×5 inch original character portraits — the animal residents of Budderlee, a village rooted in kindness.",
    images: [
      {
        url: "/budderlee/seal.webp",
        alt: "The Budderlee village seal — an oak tree, rooted in kindness",
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

export default async function BudderleePage() {
  const residents = await getBudderleePaintings();

  return (
    <div className="overflow-hidden">
      <JsonLd
        data={collectionGraph({
          path: "/budderlee",
          name: "The Residents of Budderlee",
          description: metadata.description,
          image: "/budderlee/seal.webp",
          itemPaths: residents.map((p) => `/gallery/${p.slug}`),
        })}
      />
      {/* HERO — the village seal and introduction */}
      <Section tone="surface" pad="lg" className="overflow-hidden pb-10 md:pb-12">
        <Blob size={420} color="var(--surface-variant)" style={{ left: -120, top: -40, opacity: 0.7 }} />
        <Blob size={240} color="var(--secondary-container)" style={{ right: 40, top: 120, opacity: 0.5 }} />
        <div className="relative z-10 grid gap-12 md:grid-cols-[0.85fr_1.15fr] items-center">
          {/* The village seal — assembles itself, spins, and settles.
              No blob behind it: the seal blends onto the page with
              mix-blend-multiply, so anything underneath would tint it. */}
          <div className="relative mx-auto w-[260px] sm:w-[330px] md:w-[420px]">
            <BudderleeSeal />
          </div>

          {/* The introduction */}
          <div className="flex flex-col gap-6 text-center md:text-left items-center md:items-start">
            <ArtistNote icon="🏡">
              A new collection, one resident at a time.
            </ArtistNote>
            <h1 className="font-serif text-3xl md:text-5xl leading-[1.1] tracking-[-0.015em] text-balance">
              The Residents of{" "}
              <em className="font-normal italic text-primary">Budderlee</em>
            </h1>
            <p className="font-serif italic text-xl md:text-2xl text-primary leading-snug text-balance">
              Rooted in kindness — a village where every resident matters.
            </p>
            <p className="text-lg text-on-surface-muted leading-relaxed text-pretty">
              Somewhere past the last fence post, Budderlee&rsquo;s
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
              Originals $195 · prints of every resident · collect them
              all and build the village
            </p>
          </div>
        </div>
      </Section>

      {/* RESIDENTS — the growing village grid */}
      <Section tone="low" pad="lg" className="pt-12 md:pt-14">
        <div className="flex items-end justify-between mb-10">
          <div>
            <Eyebrow>The village so far</Eyebrow>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl leading-[1.1] tracking-[-0.015em]">
              {residents.length === 0
                ? "The first residents are moving in."
                : residents.length === 1
                  ? "The first resident has arrived."
                  : `${residents.length} residents have arrived so far.`}
            </h2>
          </div>
        </div>

        {residents.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {residents.map((p) => {
              const printsFrom = lowestPrintPriceCents(p);
              return (
                <Link key={p.slug} href={`/gallery/${p.slug}`} className="group block">
                  <div className="relative aspect-square overflow-hidden bg-surface-container shadow-ambient">
                    <Image
                      src={p.images[0]}
                      alt={p.characterName ? `${p.characterName}, ${p.characterRole ?? "resident of Budderlee"}` : p.title}
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
            Each portrait introduces a new resident of Budderlee — and the
            originals tend to find homes quickly. Newsletter readers meet
            every new arrival before anyone else.
          </p>
        </div>
        <NewsletterForm />
      </Section>
    </div>
  );
}
