import Image from "next/image";
import Link from "next/link";
import { Section } from "@/components/ui/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ArtistNote } from "@/components/ui/artist-note";
import { Chip } from "@/components/ui/chip";
import { Blob } from "@/components/ui/blob";
import { WaitlistForm } from "@/components/waitlist-form";
import { SubscribeButton } from "@/components/subscribe-button";
import {
  BUDDERLEE_POST,
  formatDollars,
  getActiveSubscriberCount,
  getBudderleePostSettings,
  getSignupSchedule,
} from "@/lib/budderlee-post";

export const metadata = {
  title: `${BUDDERLEE_POST.name}, a Monthly Story-and-Art Subscription by Mail`,
  alternates: { canonical: "/budderlee/post" },
  description:
    "One resident of Budderlee in your mailbox every month: a 5×7 art card with the character's story on the back, a chapter of Tales from Budderlee, a recipe card, and a surprise sticker. $12 a month, U.S. shipping included.",
  openGraph: {
    type: "website",
    siteName: "Barbara J Demers",
    title: BUDDERLEE_POST.name,
    description: BUDDERLEE_POST.tagline,
    images: [
      {
        url: "/budderlee/seal.webp",
        alt: "The Budderlee village seal: an oak tree, rooted in kindness",
      },
    ],
  },
};

// Barbara's settings (phase, next mailing, featured resident) change in
// the admin; the global's afterChange hook revalidates this path too.
export const revalidate = 60;

const CONTENTS = [
  {
    title: "Resident art card",
    body: "A 5×7 card-stock print of the month's painting. On the back: the resident's number, birthday, star sign, job in the village, and friends.",
  },
  {
    title: "Tales from Budderlee",
    body: "A chapter of the village story, told through that month's resident. Each one picks up where the last left off.",
  },
  {
    title: "Recipe card",
    body: "A tested, original recipe with the character's stamp on it. The pie maker gets a pie.",
  },
  {
    title: "Surprise sticker",
    body: "A professionally printed die-cut sticker. Different every month.",
  },
  {
    title: "A note from Barbara",
    body: "A welcome in your first package, and a thank-you in every one after.",
  },
];

const FAQ = [
  {
    q: "When does the first package ship?",
    a: (nextMailing: string) =>
      `The first mailing is planned for ${nextMailing}. Packages go out in the first week of each month.`,
  },
  {
    q: "How does the monthly timing work?",
    a: (_: string, cutoffDay: number) =>
      `Subscribe on or before the ${ordinal(cutoffDay)} of a month and the next mailing is yours. Subscribe after the ${ordinal(cutoffDay)} and your first package is the one after that. Either way, your card is only charged for packages you'll receive.`,
  },
  {
    q: "Can I cancel or skip a month?",
    a: () =>
      "Yes. Cancel any time: ask for a link on the manage page or use the one in your emails. No phone calls, no forms. Cancel before the cutoff and you won't be charged again. To skip a month, reply to any email from Barbara and she'll pause it for you.",
  },
  {
    q: "Is there sales tax?",
    a: () =>
      "Where the law requires it, yes. It's added at checkout on top of the $12, based on your shipping address, and shown before you confirm.",
  },
  {
    q: "Do you ship outside the United States?",
    a: () =>
      "Not yet. U.S. addresses only to start, with shipping included in the price. Canada is on the list to look at once the first few mailings have gone out.",
  },
  {
    q: "What does it mean to be a founding member?",
    a: () =>
      "Everyone on the waitlist who subscribes when signups open is a founding member and gets an exclusive Founding Member sticker in their first package. It's a one-time design that won't be printed again.",
  },
];

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

export default async function BudderleePostPage() {
  const settings = await getBudderleePostSettings();
  const price = formatDollars(settings.priceCents);
  const resident = settings.firstResident;

  // Open means "open and not full". The checkout route re-checks the cap
  // at click time; this only decides what the page shows.
  const activeCount = settings.phase === "open" ? await getActiveSubscriberCount() : 0;
  const full = settings.phase === "open" && activeCount >= settings.subscriberCap;
  const canSubscribe = settings.phase === "open" && !full && !!settings.stripePriceId;
  const schedule = getSignupSchedule(settings.cutoffDay);

  const headline =
    settings.phase === "closed"
      ? "Signups are closed for now."
      : full
        ? "Every spot is taken for now."
        : canSubscribe
          ? `${price} a month. Cancel any time.`
          : "Be first in line when signups open.";

  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <Section tone="surface" pad="lg" className="overflow-hidden pb-12 md:pb-16">
        <Blob size={440} color="var(--surface-variant)" style={{ left: -140, top: -60, opacity: 0.7 }} />
        <Blob size={260} color="var(--secondary-container)" style={{ right: 20, top: 140, opacity: 0.45 }} />
        <div className="relative z-10 grid gap-12 md:grid-cols-[1.15fr_0.85fr] items-center">
          <div className="flex flex-col gap-6 text-center md:text-left items-center md:items-start">
            <ArtistNote icon="✉️">A resident of Budderlee, in the mail, every month.</ArtistNote>
            <h1 className="font-serif text-4xl md:text-6xl leading-[1.05] tracking-[-0.015em] text-balance">
              {BUDDERLEE_POST.name}
            </h1>
            <p className="font-serif italic text-xl md:text-2xl text-primary leading-snug text-balance">
              {BUDDERLEE_POST.tagline}.
            </p>
            <p className="text-lg text-on-surface-muted leading-relaxed text-pretty max-w-xl">
              Every month, one resident of Budderlee arrives in your mailbox:
              their portrait on a 5×7 card, their story on the back, a new
              chapter of <em>Tales from Budderlee</em>, a recipe, and a sticker.
              Collect the village one envelope at a time.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              <Chip>{price} a month</Chip>
              <Chip>U.S. shipping included</Chip>
              <Chip>Cancel any time</Chip>
            </div>
            <p className="text-sm text-on-surface-subtle">
              First mailing {settings.nextMailing}
              {resident ? ` · ${resident.name}${resident.role ? `, ${resident.role}` : ""}` : ""}
            </p>
            <a href="#waitlist" className="text-sm font-medium text-primary underline underline-offset-4">
              {settings.phase === "closed" ? "Get notified if it reopens" : canSubscribe ? "Subscribe" : "Join the waitlist"} ↓
            </a>
          </div>

          {/* The card on the table */}
          <div className="relative mx-auto w-full max-w-[360px] md:max-w-none">
            <Blob size={380} color="var(--primary-container-dim)" style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)", opacity: 0.9 }} />
            <div className="relative z-10 mx-auto aspect-[5/7] w-[240px] sm:w-[280px] rotate-[-3deg] rounded-[var(--radius-md)] bg-surface-container-lowest p-3 shadow-ambient-lg">
              <div className="relative aspect-square overflow-hidden rounded-[var(--radius-sm)] bg-surface-container">
                {resident?.imageUrl ? (
                  <Image
                    src={resident.imageUrl}
                    alt={`${resident.name}${resident.role ? `, ${resident.role}` : ""}`}
                    fill
                    sizes="280px"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <Image
                    src="/budderlee/seal.webp"
                    alt="The Budderlee village seal"
                    fill
                    sizes="280px"
                    className="object-contain p-6 mix-blend-multiply"
                    priority
                  />
                )}
              </div>
              <div className="mt-3 text-center">
                {resident?.number != null && (
                  <p className="text-[10px] tracking-[0.18em] uppercase text-on-surface-faint mb-1">
                    No. {String(resident.number).padStart(3, "0")}
                  </p>
                )}
                <p className="font-serif text-lg leading-tight text-on-surface">
                  {resident?.name ?? "The next resident"}
                </p>
                <p className="text-xs italic text-on-surface-muted mt-0.5">
                  {resident?.role ?? "arriving " + settings.nextMailing}
                </p>
                <p className="mt-2 text-[10px] tracking-[0.18em] uppercase text-on-surface-faint">
                  5 × 7 · card stock
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* WHAT'S IN THE ENVELOPE */}
      <Section tone="low" pad="lg">
        <div className="text-center mb-10">
          <Eyebrow>What&rsquo;s in the envelope</Eyebrow>
          <h2 className="mt-3 font-serif text-3xl md:text-4xl leading-[1.1] tracking-[-0.015em] text-balance">
            Five small things, made with care.
          </h2>
        </div>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CONTENTS.map((c) => (
            <li key={c.title} className="rounded-[var(--radius-lg)] bg-surface-container-lowest p-6">
              <h3 className="font-serif text-xl leading-tight text-on-surface">{c.title}</h3>
              <p className="mt-3 text-[15px] text-on-surface-muted leading-relaxed">{c.body}</p>
            </li>
          ))}
          <li className="rounded-[var(--radius-lg)] bg-secondary-container-soft p-6">
            <h3 className="font-serif text-xl leading-tight text-on-secondary-container">Founding Member sticker</h3>
            <p className="mt-3 text-[15px] text-on-surface-muted leading-relaxed">
              Join the waitlist now and subscribe when signups open, and your
              first package carries an exclusive one-time sticker.
            </p>
          </li>
        </ul>
      </Section>

      {/* HOW IT WORKS */}
      <Section tone="surface" pad="lg" maxWidth="4xl">
        <div className="text-center mb-10">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-3 font-serif text-3xl md:text-4xl leading-[1.1] tracking-[-0.015em] text-balance">
            {price} a month. One envelope. No fuss.
          </h2>
        </div>
        <ol className="grid gap-6 md:grid-cols-3">
          {[
            {
              n: "1",
              t: `Subscribe by the ${ordinal(settings.cutoffDay)}`,
              b: `Sign up on or before the ${ordinal(settings.cutoffDay)} and the next mailing is yours. Later than that, and your first package is the one after.`,
            },
            {
              n: "2",
              t: "It ships the first week",
              b: "Packages go out in the first week of each month from Barbara's studio, packed by hand.",
            },
            {
              n: "3",
              t: "Manage it from your inbox",
              b: "Update your address or card, or cancel, from a link in your emails. No account to remember.",
            },
          ].map((s) => (
            <li key={s.n} className="relative rounded-[var(--radius-lg)] bg-surface-container-low p-6 pt-8">
              <span className="absolute -top-3 left-6 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-on-primary-container font-serif text-base">
                {s.n}
              </span>
              <h3 className="font-serif text-xl leading-tight text-on-surface">{s.t}</h3>
              <p className="mt-3 text-[15px] text-on-surface-muted leading-relaxed">{s.b}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* SUBSCRIBE or WAITLIST */}
      {canSubscribe ? (
        <Section tone="variant" pad="lg" maxWidth="3xl" className="overflow-hidden" innerClassName="relative">
          <div id="waitlist" className="scroll-mt-24 text-center mb-8">
            <Eyebrow>Subscribe</Eyebrow>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl leading-tight text-balance">{headline}</h2>
            <p className="mt-4 text-on-surface-muted leading-relaxed max-w-xl mx-auto">
              {schedule.chargesNow
                ? `Subscribe today and your first package mails in the first week of ${schedule.firstMailingLabel}. Your card is charged now and renews on the same day each month.`
                : `The ${ordinal(settings.cutoffDay)} has passed this month, so nothing is charged today: your card is charged on ${schedule.chargeDateLabel} and your first package mails in the first week of ${schedule.firstMailingLabel}.`}
            </p>
          </div>
          <SubscribeButton label={`Subscribe for ${price} a month`} />
          <p className="mt-6 text-center text-xs text-on-surface-subtle">
            Secure checkout by Stripe. U.S. addresses only. Sales tax is added where it applies. Change your address or card, or cancel any time, from a link in your emails.
          </p>
        </Section>
      ) : (
        <Section tone="variant" pad="lg" maxWidth="3xl" className="overflow-hidden" innerClassName="relative">
          <div id="waitlist" className="scroll-mt-24 text-center mb-8">
            <Eyebrow>{settings.phase === "closed" ? "Signups closed" : full ? "Full for now" : "The waitlist"}</Eyebrow>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl leading-tight text-balance">{headline}</h2>
            <p className="mt-4 text-on-surface-muted leading-relaxed max-w-xl mx-auto">
              {settings.phase === "closed"
                ? "Leave your email and you'll be the first to know if The Budderlee Post opens again."
                : full
                  ? `${settings.subscriberCap} packages a month is all Barbara can pack by hand. Leave your email and you'll hear first when a spot opens.`
                  : `Leave your email and you'll hear from Barbara before anyone else when signups open. The first ${settings.subscriberCap} subscribers are all she can pack in a month, so the waitlist goes first.`}
            </p>
          </div>
          <WaitlistForm />
          <p className="mt-6 text-center text-xs text-on-surface-subtle">
            This list is only for {BUDDERLEE_POST.name}. It&rsquo;s separate from the studio newsletter.
          </p>
        </Section>
      )}

      {/* FAQ */}
      <Section tone="surface" pad="lg" maxWidth="3xl">
        <div className="text-center mb-10">
          <Eyebrow>Good to know</Eyebrow>
          <h2 className="mt-3 font-serif text-3xl md:text-4xl leading-[1.1] tracking-[-0.015em]">
            Questions, answered.
          </h2>
        </div>
        <dl className="grid gap-4">
          {FAQ.map((f) => (
            <div key={f.q} className="rounded-[var(--radius-lg)] bg-surface-container-low p-6">
              <dt className="font-serif text-lg leading-tight text-on-surface">{f.q}</dt>
              <dd className="mt-2 text-[15px] text-on-surface-muted leading-relaxed">
                {f.a(settings.nextMailing, settings.cutoffDay)}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-10 text-center text-sm text-on-surface-subtle">
          Meet the residents so far on{" "}
          <Link href="/budderlee" className="text-primary underline underline-offset-4">
            the Budderlee page
          </Link>
          . Already subscribed?{" "}
          <Link href="/budderlee/post/manage" className="text-primary underline underline-offset-4">
            Manage your subscription
          </Link>
          .
        </p>
      </Section>
    </div>
  );
}
