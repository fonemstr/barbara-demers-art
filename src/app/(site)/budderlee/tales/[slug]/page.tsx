import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTale, getTales } from "@/lib/tales";
import { LexicalRichText } from "@/components/rich-text";
import { BdButton, Ornament, Rule } from "@/components/budderlee/parts";
import s from "@/components/budderlee/budderlee.module.css";

export const revalidate = 60;

export async function generateStaticParams() {
  const tales = await getTales();
  return tales.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tale = await getTale(slug);
  if (!tale) return {};
  const image = tale.cover ?? tale.resident?.image;
  const description = tale.excerpt ?? `A tale of Budderlee${tale.resident ? `, told through ${tale.resident.name}'s eyes` : ""}.`;
  return {
    title: `${tale.title}: a Tale of Budderlee`,
    description,
    alternates: { canonical: `/budderlee/tales/${tale.slug}` },
    openGraph: {
      type: "article",
      siteName: "Barbara J Demers",
      title: tale.title,
      description,
      images: image ? [{ url: image.url }] : undefined,
    },
  };
}

export default async function TalePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [tale, all] = await Promise.all([getTale(slug), getTales()]);
  if (!tale) notFound();
  const resident = tale.resident;
  const illustration = tale.cover ?? resident?.image;
  const others = all.filter((t) => t.slug !== tale.slug).slice(0, 3);

  return (
    <article className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/budderlee/tales" className="text-[15px] text-on-surface-subtle hover:text-on-surface">
        <span aria-hidden="true">←</span> Tales of Budderlee
      </Link>

      <header className="mt-6 text-center">
        {resident && (
          <p className="text-sm uppercase tracking-[0.22em] text-on-surface-subtle">
            A tale of {resident.name}
            {resident.role && ` · ${resident.role}`}
          </p>
        )}
        <h1 className="mt-2 text-[40px] leading-[1.08] md:text-[52px]">{tale.title}</h1>
        <Ornament />
      </header>

      {illustration && (
        <Image
          src={illustration.url}
          alt={illustration.alt ?? (resident ? `${resident.name}, the original painting` : tale.title)}
          width={illustration.width ?? 1200}
          height={illustration.height ?? 1200}
          sizes="(min-width: 768px) 36rem, 100vw"
          className={`${s.photo} mx-auto mt-8 h-auto max-h-[70vh] w-auto max-w-full`}
          priority
        />
      )}

      <div className="mt-10">
        <LexicalRichText doc={tale.body} />
      </div>

      <div className="mt-14">
        <Rule />
      </div>
      <footer className="py-10 text-center">
        {resident && (
          <>
            <p className="text-lg">
              {resident.name} began as an original painting by Barbara J. Demers.
            </p>
            <div className="mt-4">
              <BdButton href={`/budderlee/residents/${resident.slug}`} outline>
                See {resident.name}&rsquo;s Painting
              </BdButton>
            </div>
          </>
        )}

        {others.length > 0 && (
          <div className="mt-10">
            <h2 className="text-[28px]">More tales from the village</h2>
            <ul className="mt-3 space-y-1.5 text-lg">
              {others.map((t) => (
                <li key={t.slug}>
                  <Link href={`/budderlee/tales/${t.slug}`} className="underline decoration-[color:var(--outline)] underline-offset-4 hover:decoration-[color:var(--bd-ink)]">
                    {t.title}
                  </Link>
                  {t.resident && <span className="text-on-surface-subtle"> · {t.resident.name}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mx-auto mt-12 max-w-xl rounded-[10px] bg-[color:var(--bd-sage)] px-6 py-8">
          <h2 className="text-[28px]">A new tale in the mail</h2>
          <Ornament />
          <p className="mt-3 leading-relaxed">
            Every month, The Budderlee Post brings a new chapter of Tales from Budderlee, told through
            that month&rsquo;s resident, along with their portrait, a recipe and keepsakes.
          </p>
          <div className="mt-5">
            <BdButton href="/budderlee/post">Discover The Budderlee Post</BdButton>
          </div>
        </div>
      </footer>
    </article>
  );
}
