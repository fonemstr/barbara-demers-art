import Image from "next/image";
import Link from "next/link";
import { getBudderleePaintings } from "@/data/paintings";
import { BUDDERLEE_ROSTER } from "@/data/budderlee-roster";
import { formatPrice, lowestPrintPriceCents } from "@/lib/utils";
import { BudderleeSeal } from "@/components/budderlee-seal";
import { NewsletterForm } from "@/components/newsletter-form";
import { Section } from "@/components/ui/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ArtistNote } from "@/components/ui/artist-note";
import { Chip } from "@/components/ui/chip";
import { Blob } from "@/components/ui/blob";

export const metadata = {
  title: "The Residents of Budderlee",
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
  // Roster entries drop off the coming-soon lineup the moment a painting
  // with a matching character name arrives via the admin.
  const arrivedNames = new Set(
    residents
      .map((p) => p.characterName?.toLowerCase())
      .filter((n): n is string => !!n),
  );
  const comingSoon = BUDDERLEE_ROSTER.filter(
    (r) => !arrivedNames.has(r.name.toLowerCase()),
  );
  const villageSize = residents.length + comingSoon.length;

  return (
    <div className="overflow-hidden">
      {/* HERO — the village seal and introduction */}
      <Section tone="surface" pad="lg" className="overflow-hidden">
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
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-[-0.02em] text-balance">
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
                ? `${residents.length} of ${villageSize} residents have arrived.`
                : "The first residents are moving in."}
            </h2>
          </div>
        </div>

        {residents.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-16">
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

        {/* Coming soon — the rest of the census, waiting for their portraits */}
        {comingSoon.length > 0 && (
          <div>
            <div className="max-w-2xl mb-10">
              <Eyebrow>Still to arrive</Eyebrow>
              <p className="mt-3 text-on-surface-muted leading-relaxed">
                Every one of these residents is waiting for their original
                5×5 portrait. Barbara paints them one at a time — join the
                newsletter below and you&rsquo;ll know the moment a favorite
                arrives.
              </p>
            </div>
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-10">
              {comingSoon.map((r) => (
                <li key={r.name} className="flex flex-col items-center w-[120px] md:w-[140px]">
                  <div className="bg-surface-container-lowest p-1.5 shadow-ambient">
                    <Image
                      src={r.image}
                      alt={`${r.name}, ${r.role} — ${r.animal.toLowerCase()} resident of Budderlee, portrait coming soon`}
                      width={r.width}
                      height={r.height}
                      sizes="140px"
                      className="h-36 md:h-44 w-auto"
                    />
                  </div>
                  <p className="mt-3 font-serif text-base leading-tight text-on-surface text-center">
                    {r.name}
                  </p>
                  <p className="text-xs italic text-on-surface-muted mt-0.5 text-center">
                    {r.role}
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-on-surface-subtle mt-1.5">
                    Coming soon
                  </p>
                </li>
              ))}
            </ul>
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
