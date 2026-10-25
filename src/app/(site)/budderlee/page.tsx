import Image from "next/image";
import Link from "next/link";
import { getResidents, type Painting } from "@/data/paintings";
import { formatDollars, getBudderleePostSettings } from "@/lib/budderlee-post";
import { getFeaturedTale } from "@/lib/tales";
import { DEFAULT_ORIGINALS_INCLUDES, getBudderleePageSettings } from "@/lib/budderlee-page";
import { JsonLd } from "@/components/json-ld";
import { collectionGraph } from "@/lib/schema";
import { BdButton, Ornament, Rule, SectionTitle } from "@/components/budderlee/parts";
import { ResidentCard } from "@/components/budderlee/resident-card";
import { VillageNewsForm } from "@/components/budderlee/village-news-form";
import s from "@/components/budderlee/budderlee.module.css";

export const metadata = {
  title: "Welcome to Budderlee",
  alternates: { canonical: "/budderlee" },
  description:
    "An imagined New England village brought to life through Barbara J. Demers' original paintings and interconnected stories. Meet the residents, read the tales, explore the village and get a letter from Budderlee every month.",
  openGraph: {
    type: "website",
    siteName: "Barbara J Demers",
    title: "Welcome to Budderlee",
    description: "Rooted in kindness, where every resident matters.",
    images: [{ url: "/budderlee/world/village.webp", alt: "The village of Budderlee" }],
  },
};

// Residents, tales and settings change in the admin; refresh often enough
// that none of them needs a redeploy.
export const revalidate = 60;

/** Up to three residents: available ones marked Featured first, then by number. */
function pickFeatured(residents: Painting[]): Painting[] {
  const available = residents.filter((p) => !p.sold);
  return [
    ...available.filter((p) => p.featured),
    ...available.filter((p) => !p.featured),
    ...residents.filter((p) => p.sold),
  ].slice(0, 3);
}

export default async function BudderleeWelcomePage() {
  const [residents, tale, post, page] = await Promise.all([
    getResidents(),
    getFeaturedTale(),
    getBudderleePostSettings(),
    getBudderleePageSettings(),
  ]);
  const featured = pickFeatured(residents);
  const taleResident = tale?.resident;
  const taleImage = taleResident?.image ?? tale?.cover;

  return (
    <div className="overflow-x-clip">
      <JsonLd
        data={collectionGraph({
          path: "/budderlee",
          name: "The Residents of Budderlee",
          description: metadata.description,
          image: "/budderlee/world/village.webp",
          itemPaths: residents.map((p) => `/budderlee/residents/${p.slug}`),
        })}
      />

      {/* A. WELCOME */}
      <section className={s.welcome}>
        <div className={s.welcomeCopy}>
          <Image
            src="/budderlee/seal.webp"
            alt="The Budderlee village seal: an oak tree, rooted in kindness"
            width={210}
            height={210}
            className={`${s.seal} h-auto w-[170px] md:w-[210px]`}
            priority
          />
          <h1 className="mt-4 text-[40px] leading-[1.05] md:text-[52px]">Welcome to Budderlee</h1>
          <p className="mt-3 text-xl italic text-on-surface-muted">
            Rooted in kindness, where every resident matters.
          </p>
          <div className="mt-5 max-w-md space-y-3 text-[17px] leading-relaxed">
            <p>
              An imagined New England village brought to life through original paintings and
              interconnected stories.
            </p>
            <p>
              Created by Barbara J. Demers to celebrate animals as individuals and the kindness that
              connects a community.
            </p>
          </div>
          <div className="mt-7">
            <BdButton href="/budderlee/village">Explore the Village</BdButton>
          </div>
        </div>
        <div className={s.welcomeImage}>
          <Image
            src="/budderlee/world/village.webp"
            alt="The village of Budderlee, with its green, oak tree, shops, mill and railway station"
            fill
            sizes="(min-width: 768px) 55vw, 100vw"
            priority
          />
        </div>
      </section>

      {/* B. STEP INTO A STORY */}
      {tale && (
        <>
          <Rule />
          <section className="mx-auto max-w-5xl px-6 py-14">
            <SectionTitle>Step into a story</SectionTitle>
            <div className="mt-8 grid items-center gap-10 md:grid-cols-[0.95fr_1.05fr]">
              {taleImage && (
                <Link href={`/budderlee/tales/${tale.slug}`} className="block">
                  <Image
                    src={taleImage.url}
                    alt={taleResident ? `${taleResident.name}, the original painting` : tale.title}
                    width={taleImage.width ?? 1200}
                    height={taleImage.height ?? 1200}
                    sizes="(min-width: 768px) 28rem, 100vw"
                    className={`${s.photo} h-auto w-full`}
                  />
                </Link>
              )}
              <div>
                {taleResident && (
                  <p className="text-sm uppercase tracking-[0.2em] text-on-surface-subtle">
                    Meet {taleResident.name}
                    {taleResident.role && ` · ${taleResident.role}`}
                  </p>
                )}
                <h3 className="mt-2 text-[34px] leading-tight md:text-[40px]">{tale.title}</h3>
                <div className="mt-1 flex">
                  <Ornament />
                </div>
                {tale.excerpt && <p className="mt-4 text-[18px] leading-relaxed">{tale.excerpt}</p>}
                <div className="mt-7 flex flex-wrap gap-3">
                  <BdButton href={`/budderlee/tales/${tale.slug}`}>
                    {taleResident ? `Read ${taleResident.name}’s Story` : "Read the Story"}
                  </BdButton>
                  <BdButton href="/budderlee/tales" outline>
                    Browse All Tales
                  </BdButton>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* C. BRING A RESIDENT HOME */}
      {featured.length > 0 && (
        <>
          <Rule />
          <section className="mx-auto max-w-5xl px-6 py-14">
            <SectionTitle>Bring a resident home</SectionTitle>
            <p className="mt-3 text-center text-lg">Every resident begins with an original painting.</p>
            <div className="mt-9 grid grid-cols-1 gap-10 sm:grid-cols-3">
              {featured.map((p) => (
                <ResidentCard key={p.slug} painting={p} />
              ))}
            </div>
            <div className="mt-12 grid items-center gap-8 md:grid-cols-2">
              {page.originalsPhoto && (
                <Image
                  src={page.originalsPhoto.url}
                  alt={page.originalsPhoto.alt ?? "A framed original resident painting with its package"}
                  width={page.originalsPhoto.width ?? 1200}
                  height={page.originalsPhoto.height ?? 900}
                  sizes="(min-width: 768px) 30rem, 100vw"
                  className={`${s.photo} h-auto w-full`}
                />
              )}
              <div className={page.originalsPhoto ? "" : "text-center md:col-span-2"}>
                <p className="text-lg italic">{page.originalsIncludes ?? DEFAULT_ORIGINALS_INCLUDES}</p>
                <div className="mt-6">
                  <BdButton href="/budderlee/residents">Meet All the Residents</BdButton>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* D. A LETTER FROM THE VILLAGE */}
      <section className={s.letterBand}>
        <div className={s.letterImage}>
          <Image
            src="/budderlee/post/theodore-month.webp"
            alt="A month of The Budderlee Post: the Tales from Budderlee gazette, Theodore's art card, a paper doll, a recipe card, a sticker and an iron-on"
            fill
            sizes="(min-width: 768px) 55vw, 100vw"
          />
        </div>
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
          <h2 className="text-[34px] leading-tight md:text-[40px]">A letter from the village</h2>
          <Ornament />
          <h3 className="mt-3 text-[26px]">The Budderlee Post</h3>
          <p className="mt-3 max-w-sm text-[17px] leading-relaxed">
            Meet a resident through art, stories, recipes and keepsakes delivered each month.
          </p>
          <p className="mt-3 text-[15px] text-on-surface-subtle">
            {formatDollars(post.priceCents)} a month · U.S. shipping included
          </p>
          <div className="mt-6">
            <BdButton href="/budderlee/post">Discover the Monthly Mail Club</BdButton>
          </div>
        </div>
      </section>

      {/* E. STAY CONNECTED */}
      <section className="mx-auto max-w-3xl px-6 py-14">
        <SectionTitle>Stay connected</SectionTitle>
        <p className="mb-6 mt-3 text-center text-lg">
          Hear first when new residents move in and new tales are told.
        </p>
        <VillageNewsForm />
      </section>
    </div>
  );
}
