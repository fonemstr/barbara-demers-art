import Image from "next/image";
import Link from "next/link";
import { getTales, type Tale } from "@/lib/tales";
import { BdButton, SectionTitle } from "@/components/budderlee/parts";
import s from "@/components/budderlee/budderlee.module.css";

export const metadata = {
  title: "Tales of Budderlee",
  alternates: { canonical: "/budderlee/tales" },
  description:
    "Stories from the village of Budderlee. They all share one village, with its events seen through different residents' eyes.",
};

export const revalidate = 60;

function taleImage(t: Tale) {
  return t.resident?.image ?? t.cover;
}

export default async function TalesPage() {
  const tales = await getTales();
  const featured = tales.find((t) => t.featured) ?? tales[0];
  const rest = tales.filter((t) => t !== featured);

  return (
    <section className="mx-auto max-w-5xl px-6 py-14">
      <SectionTitle as="h1">Tales of Budderlee</SectionTitle>
      <p className="mx-auto mt-5 max-w-2xl text-center text-lg leading-relaxed">
        Every tale takes place in the same village. Each one is told through a different
        resident&rsquo;s eyes, so the same festival, the same snowfall or the same shop window can
        look a little different from one story to the next.
      </p>

      {!featured ? (
        <p className="mt-12 text-center italic">The first tale is being written.</p>
      ) : (
        <>
          <article className="mt-12 grid items-center gap-10 md:grid-cols-[0.9fr_1.1fr]">
            {taleImage(featured) && (
              <Link href={`/budderlee/tales/${featured.slug}`}>
                <Image
                  src={taleImage(featured)!.url}
                  alt={featured.resident ? `${featured.resident.name}, the original painting` : featured.title}
                  width={taleImage(featured)!.width ?? 1200}
                  height={taleImage(featured)!.height ?? 1200}
                  sizes="(min-width: 768px) 26rem, 100vw"
                  className={`${s.photo} h-auto w-full`}
                />
              </Link>
            )}
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-on-surface-subtle">
                Featured tale{featured.resident ? ` · ${featured.resident.name}` : ""}
              </p>
              <h2 className="mt-2 text-[36px] leading-tight md:text-[42px]">{featured.title}</h2>
              {featured.excerpt && <p className="mt-4 text-[18px] leading-relaxed">{featured.excerpt}</p>}
              <div className="mt-6">
                <BdButton href={`/budderlee/tales/${featured.slug}`}>Read the Tale</BdButton>
              </div>
            </div>
          </article>

          {rest.length > 0 && (
            <div className="mt-14">
              <h2 className="mb-2 text-center text-[30px]">More tales</h2>
              {rest.map((t) => (
                <StoryCard key={t.slug} tale={t} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function StoryCard({ tale }: { tale: Tale }) {
  const img = taleImage(tale);
  return (
    <Link href={`/budderlee/tales/${tale.slug}`} className={s.storyCard}>
      {img ? (
        <Image
          src={img.url}
          alt=""
          width={img.width ?? 600}
          height={img.height ?? 600}
          sizes="140px"
          className={`${s.photo} h-auto w-full`}
        />
      ) : (
        <span />
      )}
      <div>
        <h3 className="text-[26px] leading-tight transition-colors">{tale.title}</h3>
        {tale.resident && (
          <p className="mt-1 text-sm uppercase tracking-[0.18em] text-on-surface-subtle">{tale.resident.name}</p>
        )}
        {tale.excerpt && <p className="mt-2 leading-relaxed">{tale.excerpt}</p>}
      </div>
    </Link>
  );
}
