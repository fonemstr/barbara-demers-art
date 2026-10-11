import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import {
  getResident,
  getResidents,
  PRINT_SHIPPING_RATE,
  residentName,
  residentNumberLabel,
  SHIPPING_RATES,
} from "@/data/paintings";
import { formatPrice } from "@/lib/utils";
import { formatBirthday, STAR_SIGN_LABELS } from "@/lib/zodiac";
import { getTalesForResident } from "@/lib/tales";
import { DEFAULT_ORIGINALS_INCLUDES, getBudderleePageSettings } from "@/lib/budderlee-page";
import { paintingGraph } from "@/lib/schema";
import { JsonLd } from "@/components/json-ld";
import { BuyButton } from "@/components/buy-button";
import { PrintBuy } from "@/components/print-buy";
import { PaintingGallery } from "@/components/painting-gallery";
import { BdButton, Ornament, Rule } from "@/components/budderlee/parts";

export const revalidate = 60;

export async function generateStaticParams() {
  const residents = await getResidents();
  return residents.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getResident(slug);
  if (!p) return {};
  const name = residentName(p);
  const title = `${name}${p.characterRole ? `, ${p.characterRole}` : ""}: a Resident of Budderlee`;
  const description =
    p.description?.trim() ||
    `${name}, an original ${p.widthIn}×${p.heightIn} inch painting of a resident of Budderlee by Barbara J. Demers.`;
  return {
    title,
    description,
    alternates: { canonical: `/budderlee/residents/${p.slug}` },
    openGraph: {
      type: "article",
      siteName: "Barbara J Demers",
      title,
      description,
      images: [{ url: p.images[0], alt: `${name}, the original painting` }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function ResidentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug !== slug.toLowerCase()) permanentRedirect(`/budderlee/residents/${slug.toLowerCase()}`);
  const [p, page] = await Promise.all([getResident(slug), getBudderleePageSettings()]);
  if (!p) notFound();
  const tales = await getTalesForResident(p.slug);

  const name = residentName(p);
  const number = residentNumberLabel(p.residentNumber);
  const shipping = SHIPPING_RATES[p.sizeTier];
  const prints = p.prints ?? [];
  const story = p.storyBehindPainting?.trim();
  const details: { label: string; value: React.ReactNode }[] = [];
  if (p.dateOfBirth) details.push({ label: "Birthday", value: formatBirthday(p.dateOfBirth) });
  if (p.starSign) details.push({ label: "Star sign", value: STAR_SIGN_LABELS[p.starSign] });
  if (p.home) details.push({ label: "Home", value: p.home });
  if (p.friends?.length)
    details.push({
      label: p.friends.length === 1 ? "Friend" : "Friends",
      value: p.friends.map((f, i) => (
        <span key={f.slug}>
          {i > 0 && ", "}
          <Link href={`/budderlee/residents/${f.slug}`} className="underline decoration-[color:var(--outline)] underline-offset-4 hover:decoration-[color:var(--bd-ink)]">
            {f.name}
          </Link>
        </span>
      )),
    });

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <JsonLd data={paintingGraph(p)} />
      <Link href="/budderlee/residents" className="text-[15px] text-on-surface-subtle hover:text-on-surface">
        <span aria-hidden="true">←</span> Meet the Residents
      </Link>

      <div className="mt-6 grid items-start gap-12 md:grid-cols-[1.15fr_1fr]">
        <PaintingGallery
          title={name}
          images={p.images}
          widthIn={p.widthIn}
          heightIn={p.heightIn}
          themedIndexes={p.themedImages}
        />

        <div>
          {number && <p className="text-[12px] uppercase tracking-[0.24em] text-on-surface-faint">{number}</p>}
          <h1 className="mt-1 text-[44px] leading-[1.05] md:text-[54px]">{name}</h1>
          {p.characterRole && <p className="mt-1 text-xl italic text-on-surface-muted">{p.characterRole}</p>}
          <div className="mt-2 flex">
            <Ornament />
          </div>
          {p.description && <p className="mt-5 text-[18px] leading-relaxed">{p.description}</p>}

          <dl className="mt-7 grid grid-cols-[auto_1fr] gap-x-8 gap-y-2.5 border-y border-[color:var(--bd-line)] py-5 text-[16px]">
            <dt className="text-on-surface-subtle">Size</dt>
            <dd>
              {p.widthIn} × {p.heightIn} in original
            </dd>
            <dt className="text-on-surface-subtle">Materials</dt>
            <dd>{p.medium}</dd>
            <dt className="text-on-surface-subtle">Original</dt>
            <dd>
              {p.sold ? (
                <span className="text-[color:var(--bd-rust)]">Sold</span>
              ) : (
                <>
                  {formatPrice(p.priceCents)}{" "}
                  <span className="text-on-surface-subtle">
                    {shipping.cents === 0 ? "· free shipping" : `+ ${formatPrice(shipping.cents)} shipping`}
                  </span>
                </>
              )}
            </dd>
            <dt className="text-on-surface-subtle">Includes</dt>
            <dd>{page.originalsIncludes ?? DEFAULT_ORIGINALS_INCLUDES}</dd>
          </dl>

          <div className="mt-6 space-y-6">
            {p.sold ? (
              <p className="italic">
                {name}&rsquo;s original has found a home.
                {prints.length > 0 ? " Prints keep this resident available." : ""}
              </p>
            ) : (
              <div className="space-y-3">
                <BuyButton slug={p.slug} />
                <p className="text-sm text-on-surface-subtle">
                  Secure checkout by Stripe. Sales tax is added where it applies. Packed and shipped from
                  the studio within 5 business days.
                </p>
              </div>
            )}
            {prints.length > 0 && (
              <div className="rounded-[8px] bg-[#fffdf8] p-5 shadow-[inset_0_0_0_1px_var(--bd-line)]">
                <h2 className="text-[24px]">Prints</h2>
                <p className="mb-4 mt-1 text-[15px] text-on-surface-muted">
                  Archival prints of {name}, made to order.
                </p>
                <PrintBuy
                  slug={p.slug}
                  prints={prints.map(({ id, widthIn, heightIn, priceCents }) => ({ id, widthIn, heightIn, priceCents }))}
                />
                <p className="mt-3 text-xs text-on-surface-subtle">
                  {PRINT_SHIPPING_RATE.cents === 0
                    ? "Free shipping on prints."
                    : `Flat ${formatPrice(PRINT_SHIPPING_RATE.cents)} shipping per print order.`}{" "}
                  Secure checkout by Stripe. Sales tax is added where it applies.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {(details.length > 0 || tales.length > 0 || story) && (
        <>
          <div className="mt-14">
            <Rule />
          </div>
          <section className="mx-auto max-w-3xl py-12 text-center">
            <h2 className="text-[34px]">About {name}</h2>
            <Ornament />
            {details.length > 0 && (
              <dl className="mx-auto mt-6 grid max-w-md grid-cols-[auto_1fr] gap-x-8 gap-y-2.5 text-left text-[17px]">
                {details.map((d) => (
                  <div key={d.label} className="contents">
                    <dt className="text-on-surface-subtle">{d.label}</dt>
                    <dd>{d.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {story && (
              <div className="mt-8 space-y-4 text-left text-[18px] leading-relaxed">
                {story.split(/\n\s*\n/).map((para, i) => (
                  <p key={i}>{para.trim()}</p>
                ))}
              </div>
            )}
            {tales.length > 0 && (
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {tales.map((t, i) => (
                  <BdButton key={t.slug} href={`/budderlee/tales/${t.slug}`}>
                    {i === 0 ? `Read ${name}’s Story` : t.title}
                  </BdButton>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
