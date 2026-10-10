import Image from "next/image";
import Link from "next/link";
import { Allura, Cinzel } from "next/font/google";
import { getBudderleePaintings } from "@/data/paintings";
import { formatPrice, lowestPrintPriceCents } from "@/lib/utils";
import { NewsletterForm } from "@/components/newsletter-form";
import {
  BUDDERLEE_POST,
  formatDollars,
  getActiveSubscriberCount,
  getBudderleePostSettings,
  getSignupSchedule,
  type PostResident,
} from "@/lib/budderlee-post";
import { Section } from "@/components/ui/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { JsonLd } from "@/components/json-ld";
import { collectionGraph } from "@/lib/schema";
import { PostEnvelope } from "@/components/budderlee-page/post-envelope";
import { SignupCountdown } from "@/components/budderlee-page/signup-countdown";
import { UnpackViewer, type UnpackStep } from "@/components/budderlee-page/unpack-viewer";
import { FlyoverVideo } from "@/components/budderlee-page/flyover-video";
import s from "@/components/budderlee-page/budderlee-page.module.css";

// The envelope's lettering: Cinzel capitals for the return address and
// Allura for the handwriting, as on Barbara's printed Budderlee envelope.
// Loaded here so only this page pays for them.
const cinzel = Cinzel({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-cinzel", display: "swap" });
const allura = Allura({ subsets: ["latin"], weight: "400", variable: "--font-allura", display: "swap" });

export const metadata = {
  title: "The Budderlee Post and the Residents of Budderlee",
  alternates: { canonical: "/budderlee" },
  description:
    "One resident of Budderlee in your mailbox every month: a 5×7 art card, a chapter of Tales from Budderlee, a recipe, a paper doll and a sticker, $12 a month. Plus the original 5×5 inch paintings of every resident.",
  openGraph: {
    type: "website",
    siteName: "Barbara J Demers",
    title: "The Budderlee Post and the Residents of Budderlee",
    description:
      "A resident of Budderlee in your mailbox every month, and the original paintings behind them.",
    images: [
      {
        url: "/budderlee/seal.webp",
        alt: "The Budderlee village seal: an oak tree, rooted in kindness",
      },
    ],
  },
};

// New residents arrive via the admin and the Post's settings change there
// too; refresh often enough that neither needs a redeploy.
export const revalidate = 60;

// What's in the envelope, framed on Walter's month photo. Each box is the
// item's outline in the photo, as fractions of its width and height.
const UNPACK: UnpackStep[] = [
  {
    kicker: "The whole month",
    title: "Six things, one resident",
    body: "Everything arrives together in one envelope in the first week of the month, all built around that month's villager.",
    box: [0, 0, 1, 1],
  },
  {
    kicker: "01",
    title: "Resident art card",
    body: "A 5×7 card-stock print of the month's painting. On the back: the resident's number, birthday, star sign, job in the village and friends.",
    box: [0.385, 0.355, 0.755, 0.97],
  },
  {
    kicker: "02",
    title: "Tales from Budderlee",
    body: "A new chapter of the village story, told through that month's resident. Each one picks up where the last left off.",
    box: [0, 0.02, 0.47, 0.62],
  },
  {
    kicker: "03",
    title: "Recipe card",
    body: "A tested, original recipe with the character's stamp on it. Walter brings his shortbread biscuits.",
    box: [0.64, 0.015, 1, 0.625],
  },
  {
    kicker: "04",
    title: "Paper doll",
    body: "Cut out the resident and stand them up, with a fold-back base and a few of their favorite things.",
    box: [0.38, 0, 0.715, 0.375],
  },
  {
    kicker: "05",
    title: "Sticker, and a note from Barbara",
    body: "A die-cut sticker that's different every month, plus a note from Barbara: a welcome in your first package and a thank-you in every one after.",
    box: [0.725, 0.6, 0.945, 0.856],
  },
];

const FOUNDING_STEP: UnpackStep = {
  kicker: "Founding members",
  title: "The Walter iron-on",
  body: "Waitlist members who subscribe when signups open get an exclusive iron-on in their first package. It won't be printed again.",
  badge: "Founding members only",
  box: [0.095, 0.5, 0.41, 1],
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "November 2026" plus n months, as "Dec 2026"; undefined if unparseable. */
function monthAfter(label: string, n: number) {
  const [name, year] = label.split(" ");
  const m = MONTHS.indexOf(name);
  if (m < 0 || !Number(year)) return undefined;
  const total = m + n;
  return `${MONTHS[total % 12].slice(0, 3)} ${Number(year) + Math.floor(total / 12)}`;
}

/** Founding Member gifts go to waitlist members who join before this date. */
function foundingWindowOpen(ends?: string) {
  return !!ends && new Date(ends).getTime() > Date.now();
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

export default async function BudderleePage() {
  const [residents, post] = await Promise.all([
    getBudderleePaintings(),
    getBudderleePostSettings(),
  ]);

  const price = formatDollars(post.priceCents);
  const featured = post.firstResident;
  const activeCount = post.phase === "open" ? await getActiveSubscriberCount() : 0;
  const full = post.phase === "open" && activeCount >= post.subscriberCap;
  const canSubscribe = post.phase === "open" && !full && !!post.stripePriceId;
  const schedule = getSignupSchedule(post.cutoffDay);
  const founding = post.phase !== "closed" && foundingWindowOpen(post.foundingWindowEnds);
  // The countdown's resident is only right while the next open mailing is
  // the one the featured resident is in.
  const featuredMailsNext = !!featured && schedule.firstMailingLabel === post.nextMailing;

  const cta = canSubscribe
    ? `Subscribe for ${price} a month`
    : post.phase === "closed"
      ? "Get notified if it reopens"
      : full
        ? "Join the list for a spot"
        : "Join the waitlist";

  const unpack = founding ? [...UNPACK, FOUNDING_STEP] : UNPACK;

  // The strip of months: the featured resident first, then residents still
  // to come, kept a surprise.
  // Before Barbara picks the featured resident, the first resident leads.
  const lead: PostResident | undefined =
    featured ??
    (residents[0] && {
      name: residents[0].characterName ?? residents[0].title,
      role: residents[0].characterRole,
      number: residents[0].residentNumber,
      slug: residents[0].slug,
      imageUrl: residents[0].images[0],
    });
  const others = residents.filter((r) => r.slug !== lead?.slug).slice(0, 8);

  return (
    <div className={`${s.page} ${cinzel.variable} ${allura.variable} overflow-x-clip`}>
      <JsonLd
        data={collectionGraph({
          path: "/budderlee",
          name: "The Residents of Budderlee",
          description: metadata.description,
          image: "/budderlee/seal.webp",
          itemPaths: residents.map((p) => `/gallery/${p.slug}`),
        })}
      />

      {/* HERO: The Budderlee Post arriving */}
      <section className={`${s.hero} relative`}>
        <div className="mx-auto max-w-6xl px-6 pt-10 pb-16 md:pt-16 md:pb-24 grid gap-8 lg:gap-12 lg:grid-cols-[1fr_1.1fr] items-center">
          <div className="flex flex-col gap-6 order-2 lg:order-1 text-center lg:text-left items-center lg:items-start">
            <Eyebrow className="text-primary font-semibold">
              {BUDDERLEE_POST.name} · a subscription by mail
            </Eyebrow>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-[-0.015em] text-balance">
              A resident of Budderlee, in your{" "}
              <em className="font-normal italic text-primary">mailbox</em> every month.
            </h1>
            <p className="text-lg text-on-surface-muted leading-relaxed text-pretty max-w-xl">
              Each envelope brings one of Barbara&rsquo;s painted villagers home:
              their portrait, their story, a recipe, a paper doll and a sticker.
              Collect the whole village, one letter at a time.
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-3">
              <Link
                href="/budderlee/post#waitlist"
                className="btn-primary-face inline-flex items-center rounded-full px-7 py-4 font-semibold"
              >
                {cta}
              </Link>
              <a
                href="#unpack"
                className="inline-flex items-center rounded-full px-7 py-4 font-semibold text-on-surface shadow-[inset_0_0_0_1.5px_rgb(54_57_44/0.3)] hover:shadow-[inset_0_0_0_1.5px_var(--on-surface)] transition-shadow"
              >
                See what&rsquo;s inside ↓
              </a>
            </div>
            {canSubscribe ? (
              <SignupCountdown
                deadline={schedule.signupDeadline.toISOString()}
                label={
                  featured && featuredMailsNext ? (
                    <>
                      <b className="text-on-surface">{`${featured.name} mails in ${schedule.firstMailingLabel.split(" ")[0]}.`}</b>{" "}
                      {`Subscribe by ${schedule.signupDeadlineLabel} to get that envelope.`}
                    </>
                  ) : (
                    <>
                      <b className="text-on-surface">{`Next mailing: ${schedule.firstMailingLabel}.`}</b>{" "}
                      {`Subscribe by ${schedule.signupDeadlineLabel}.`}
                    </>
                  )
                }
              />
            ) : (
              <p className="text-sm text-on-surface-subtle">
                {price} a month · U.S. shipping included · first mailing {post.nextMailing}
              </p>
            )}
          </div>
          <div className="order-1 lg:order-2 w-full max-w-xl mx-auto lg:max-w-none">
            <PostEnvelope />
          </div>
        </div>
      </section>

      {/* WHAT'S IN THE ENVELOPE */}
      <Section tone="low" pad="lg">
        <div id="unpack" className="scroll-mt-24 text-center max-w-2xl mx-auto mb-14">
          <Eyebrow className="text-primary font-semibold">What&rsquo;s in the envelope</Eyebrow>
          <h2 className="mt-3 font-serif text-3xl md:text-5xl leading-[1.1] tracking-[-0.015em] text-balance">
            Open it slowly. There&rsquo;s a lot tucked inside.
          </h2>
          <p className="mt-4 text-lg text-on-surface-muted leading-relaxed">
            This is Walter&rsquo;s month, Resident No. 001, exactly as it ships.
            Scroll to unpack it piece by piece.
          </p>
        </div>
        <UnpackViewer steps={unpack} />
      </Section>

      {/* A NEW RESIDENT EVERY MONTH */}
      {lead && (
        <section className={`${s.months} py-24 overflow-hidden`}>
          <div className={`${s.reveal} mx-auto max-w-6xl px-6 mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6`}>
            <div>
              <Eyebrow className="text-primary font-semibold">Month after month</Eyebrow>
              <h2 className="mt-3 font-serif text-3xl md:text-[46px] leading-[1.1] tracking-[-0.015em] text-balance">
                A new face at the door every month.
              </h2>
            </div>
            <p className="max-w-sm text-on-surface-muted leading-relaxed">
              {`${lead.name} goes first.`} After that, nobody knows who&rsquo;s coming
              next until the envelope lands. Keep them all and you&rsquo;ll have the
              whole village.
            </p>
          </div>
          <div className={s.monthsTrack}>
            {[0, 1].map((copy) => (
              <MonthCards key={copy} hidden={copy === 1} featured={lead} others={others} first={post.nextMailing} />
            ))}
          </div>
        </section>
      )}

      {/* THE PITCH */}
      {post.phase !== "closed" && (
        <section className="pt-6 pb-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className={`${s.ticket} ${s.reveal}`}>
              <div className="px-6 py-10 md:px-14 md:py-16">
                <Eyebrow className="text-primary-container font-semibold">Join the village</Eyebrow>
                <h2 className="mt-4 font-serif text-4xl md:text-[54px] leading-[1.05] tracking-[-0.015em] text-white! text-balance">
                  Your first letter from Budderlee is{" "}
                  <em className="font-normal italic text-primary-container">waiting</em>.
                </h2>
                <p className="mt-5 mb-8 max-w-md text-lg leading-relaxed text-[#cfd1c3]">
                  Something small and lovely to look forward to every month, for
                  you or for a little one who checks the mailbox first.
                </p>
                <ul className={`${s.checks} mb-9`}>
                  <li>One resident, six keepsakes, every month</li>
                  <li>U.S. shipping included</li>
                  <li>Cancel any time with one link. No calls, no forms.</li>
                  <li>Subscribe by the {ordinal(post.cutoffDay)} for next month&rsquo;s mailing</li>
                </ul>
                <Link href="/budderlee/post#waitlist" className={`${s.goldButton} ${s.shine}`}>
                  {canSubscribe ? `Subscribe to ${BUDDERLEE_POST.name}` : cta} →
                </Link>
              </div>
              <div className={`${s.ticketStub} px-6 py-10 md:px-12 md:py-14 flex flex-col justify-center gap-7`}>
                <div className={s.price}>
                  <sup>$</sup>
                  {post.priceCents / 100}
                  <span className="font-sans text-lg font-medium text-[#b9bcab]"> / month</span>
                </div>
                <p className="text-[15px] leading-relaxed text-[#b9bcab]">
                  Barbara packs every envelope by hand, so the Post is{" "}
                  <b className="text-white">limited to {post.subscriberCap} subscribers</b>.
                </p>
                {founding && (
                  <div className={s.ironOn}>
                    <Image src="/budderlee/seal.webp" alt="" width={64} height={64} />
                    <p className="text-sm leading-snug text-[#eaebe5]">
                      <b className="text-primary-container">Founding Member gift.</b> Join the
                      waitlist and subscribe when signups open, and your first envelope
                      includes the Walter iron-on.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* THE FLYOVER */}
      <section className={s.fly}>
        <FlyoverVideo />
        <div className={`${s.flyInner} mx-auto max-w-6xl px-6 pb-20`}>
          <Eyebrow className="text-primary-container font-semibold">The flyover</Eyebrow>
          <h2 className="mt-4 font-serif text-5xl md:text-7xl leading-[1.02] tracking-[-0.015em] text-white!">
            Fly over Budderlee.
          </h2>
          <p className="mt-5 mb-8 max-w-xl text-lg leading-relaxed text-[#eceadf]">
            Swoop down over the village green, along Market Street, past Hugo&rsquo;s
            station and into the orchard. Every resident you&rsquo;ll meet in the mail
            lives here.
          </p>
          <Link
            href="/budderlee/village"
            className="inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 font-semibold text-on-surface transition-transform hover:-translate-y-0.5"
          >
            <span className={s.play} aria-hidden="true" />
            Take the flyover
          </Link>
        </div>
      </section>

      {/* THE ORIGINALS */}
      <Section tone="low" pad="lg">
        <div className={`${s.reveal} grid gap-6 md:grid-cols-2 md:items-end mb-12`}>
          <div>
            <Eyebrow className="text-primary font-semibold">The original paintings</Eyebrow>
            <h2 className="mt-3 font-serif text-3xl md:text-[46px] leading-[1.1] tracking-[-0.015em] text-balance">
              Own the painting behind the postcard.
            </h2>
          </div>
          <p className="text-[17px] text-on-surface-muted leading-relaxed">
            Every resident starts as a one-of-a-kind 5×5 inch original by Barbara.
            Originals tend to find homes quickly, and prints of every resident are
            available too.
            {residents.length > 1 && ` ${residents.length} residents have arrived so far.`}
          </p>
          <p className="md:col-start-2 -mt-2 text-sm italic text-on-surface-subtle">
            Photos show each painting styled in a themed scene. The frame and
            setting are for display and may not match what ships.
            {residents.length > 0 &&
              residents.every((r) => r.asShippedImage !== undefined) &&
              " Each painting\u2019s page includes a photo of it as it ships."}
          </p>
        </div>

        {residents.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10 md:gap-8">
            {residents.map((p) => {
              const printsFrom = lowestPrintPriceCents(p);
              return (
                <Link key={p.slug} href={`/gallery/${p.slug}`} className={`${s.original} ${s.reveal} group block text-center`}>
                  <div className={s.frame}>
                    <div className={s.frameMat}>
                      <div className={s.frameArt}>
                        <Image
                          src={p.images[0]}
                          alt={p.characterName ? `${p.characterName}, ${p.characterRole ?? "resident of Budderlee"}` : p.title}
                          fill
                          sizes="(min-width: 1024px) 22vw, (min-width: 768px) 30vw, 45vw"
                          className="object-cover"
                        />
                      </div>
                    </div>
                    {p.sold && (
                      <div className="absolute top-5 right-5 bg-on-surface/90 text-surface text-[10px] tracking-[0.16em] uppercase px-2.5 py-1 rounded-full">
                        Found a home
                      </div>
                    )}
                  </div>
                  {p.residentNumber != null && (
                    <p className="mt-4 text-[10px] tracking-[0.18em] uppercase text-on-surface-faint">
                      No. {String(p.residentNumber).padStart(3, "0")}
                    </p>
                  )}
                  <h3 className="mt-1 font-serif text-xl leading-tight text-on-surface">
                    {p.characterName ?? p.title}
                  </h3>
                  {p.characterRole && (
                    <p className="text-sm italic text-on-surface-muted mt-1">{p.characterRole}</p>
                  )}
                  <p className="text-sm text-on-surface-subtle mt-2 tabular-nums">
                    {p.sold
                      ? printsFrom !== undefined
                        ? `Prints from ${formatPrice(printsFrom)}`
                        : "Original sold"
                      : `Original ${formatPrice(p.priceCents)}`}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </Section>

      {/* NEWSLETTER */}
      <Section tone="surface" pad="lg" maxWidth="3xl">
        <div className="text-center mb-8">
          <Eyebrow>Not ready to subscribe?</Eyebrow>
          <h2 className="mt-3 font-serif text-3xl md:text-4xl leading-tight">
            Meet each new resident first.
          </h2>
          <p className="mt-4 text-on-surface-muted leading-relaxed max-w-xl mx-auto">
            Newsletter readers meet every new original before anyone else.
          </p>
        </div>
        <NewsletterForm />
      </Section>
    </div>
  );
}

function MonthCards({
  featured,
  others,
  first,
  hidden,
}: {
  featured: PostResident;
  others: Awaited<ReturnType<typeof getBudderleePaintings>>;
  first: string;
  hidden: boolean;
}) {
  return (
    // The second copy only exists to make the strip loop seamlessly.
    <div className="flex gap-[22px] pr-[22px]" aria-hidden={hidden || undefined}>
      <div className={`${s.monthCard} ${s.monthCardFirst}`}>
        <div className={s.monthPic}>
          {featured.imageUrl && (
            <Image src={featured.imageUrl} alt={hidden ? "" : featured.name} fill sizes="220px" />
          )}
        </div>
        <p className="mt-3 text-[10px] tracking-[0.2em] uppercase text-on-surface-faint">
          {monthAfter(first, 0) ?? first}
          {featured.number != null && ` · No. ${String(featured.number).padStart(3, "0")}`}
        </p>
        <p className="mt-1 font-serif text-xl text-on-surface">
          {featured.name}
          {featured.role && `, ${featured.role}`}
        </p>
      </div>
      {others.map((r, i) => (
        <div key={r.slug} className={s.monthCard}>
          <div className={`${s.monthPic} ${s.mystery}`}>
            <Image src={r.images[0]} alt="" fill sizes="220px" />
          </div>
          <p className="mt-3 text-[10px] tracking-[0.2em] uppercase text-on-surface-faint">
            {monthAfter(first, i + 1) ?? "Coming soon"}
          </p>
          <p className="mt-1 font-serif text-xl text-on-surface">Who&rsquo;s next?</p>
        </div>
      ))}
    </div>
  );
}
