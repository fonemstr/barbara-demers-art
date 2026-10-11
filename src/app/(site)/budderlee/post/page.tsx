import Image from "next/image";
import Link from "next/link";
import localFont from "next/font/local";
import { WaitlistForm } from "@/components/waitlist-form";
import { SubscribeButton } from "@/components/subscribe-button";
import { PostEnvelope } from "@/components/budderlee-page/post-envelope";
import { SignupCountdown } from "@/components/budderlee-page/signup-countdown";
import { UnpackViewer, type UnpackStep } from "@/components/budderlee-page/unpack-viewer";
import { BdButton, Ornament, Rule, SectionTitle } from "@/components/budderlee/parts";
import { cleanResidentName } from "@/data/paintings";
import {
  BUDDERLEE_POST,
  formatDollars,
  getActiveSubscriberCount,
  getBudderleePostSettings,
  getFoundingWindow,
  getSignupSchedule,
} from "@/lib/budderlee-post";

// The envelope's lettering: Cinzel capitals for the return address and
// Allura for the handwriting, as on Barbara's printed Budderlee envelope.
const cinzel = localFont({
  variable: "--font-cinzel",
  src: [
    { path: "../../../fonts/cinzel/cinzel-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../../../fonts/cinzel/cinzel-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  adjustFontFallback: "Times New Roman",
});
const allura = localFont({
  variable: "--font-allura",
  src: "../../../fonts/allura/allura-latin-400-normal.woff2",
  weight: "400",
  display: "swap",
});

export const metadata = {
  title: `${BUDDERLEE_POST.name}, a Monthly Story-and-Art Subscription by Mail`,
  alternates: { canonical: "/budderlee/post" },
  description:
    "One resident of Budderlee in your mailbox every month: a 5×7 art card with the character's story on the back, a chapter of Tales from Budderlee, a recipe card, a paper doll, and a surprise sticker. $12 a month, U.S. shipping included.",
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

// Every regular item, framed on Walter's month photo. Each box is the
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
    a: (_: string, __: number, foundingLastDay?: string) =>
      `Everyone who subscribes ${foundingLastDay ? `by ${foundingLastDay}` : "at launch"} is a founding member and gets an exclusive Founding Member iron-on in their first package. It's a one-time design that won't be printed again.`,
  },
];

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

export default async function BudderleePostPage() {
  const settings = await getBudderleePostSettings();
  const foundingWindow = getFoundingWindow(settings.foundingWindowEnds);
  const founding = foundingWindow?.open ? foundingWindow : undefined;
  const price = formatDollars(settings.priceCents);

  // Open means "open and not full". The checkout route re-checks the cap
  // at click time; this only decides what the page shows.
  const activeCount = settings.phase === "open" ? await getActiveSubscriberCount() : 0;
  const full = settings.phase === "open" && activeCount >= settings.subscriberCap;
  const canSubscribe = settings.phase === "open" && !full && !!settings.stripePriceId;
  const schedule = getSignupSchedule(settings.cutoffDay);
  // The featured resident is the one in the next mailing; a signup only gets
  // that envelope while the next mailing is still the one it would receive.
  const resident = settings.firstResident;
  const residentIsNext = !!resident && schedule.firstMailingLabel === settings.nextMailing;
  const signupLabel =
    settings.phase === "closed" ? "Get Notified" : canSubscribe ? "Subscribe" : full ? "Join the List" : "Join the Waitlist";

  const headline =
    settings.phase === "closed"
      ? "Signups are closed for now."
      : full
        ? "Every spot is taken for now."
        : canSubscribe
          ? `${price} a month. Cancel any time.`
          : "Be first in line when signups open.";

  return (
    <div className={`${cinzel.variable} ${allura.variable} overflow-x-clip`}>
      {/* INVITATION */}
      <section className="mx-auto grid max-w-6xl items-center gap-6 px-6 pb-10 pt-12 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
        <div className="order-2 text-center lg:order-1 lg:text-left">
          <p className="text-sm uppercase tracking-[0.22em] text-on-surface-subtle">A monthly mail club</p>
          <h1 className="mt-2 text-[44px] leading-[1.05] md:text-[58px]">{BUDDERLEE_POST.name}</h1>
          <div className="mt-1 flex lg:[&_svg]:ml-0">
            <Ornament />
          </div>
          <p className="mx-auto mt-5 max-w-xl text-[19px] leading-relaxed lg:mx-0">
            Every month, one resident of Budderlee arrives in your mailbox: their portrait on a 5×7
            card, their story on the back, a new chapter of <em>Tales from Budderlee</em>, a recipe,
            a paper doll and a sticker. Collect the village one envelope at a time.
          </p>
          <p className="mt-4 text-[16px] text-on-surface-subtle">
            {price} a month · U.S. shipping included · Cancel any time
          </p>
          <div className="mt-6">
            <BdButton href="#signup">{signupLabel}</BdButton>
          </div>
        </div>
        <div className="order-1 w-full max-w-xl justify-self-center lg:order-2 lg:max-w-none">
          <PostEnvelope />
        </div>
      </section>

      {/* THE PACKAGE */}
      <Rule />
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div id="unpack" className="mx-auto mb-12 max-w-2xl scroll-mt-6 text-center">
          <SectionTitle>What&rsquo;s in the envelope</SectionTitle>
          <p className="mt-4 text-lg leading-relaxed">
            This is Walter&rsquo;s month, Resident No. 001, exactly as it ships. Scroll to unpack it
            piece by piece.
          </p>
        </div>
        <UnpackViewer steps={UNPACK} />
      </section>

      {/* NEXT MAILING */}
      <Rule />
      <section className="mx-auto max-w-5xl px-6 py-14">
        <SectionTitle>The next envelope</SectionTitle>
        <div className="mt-9 grid items-center gap-10 md:grid-cols-[0.8fr_1.2fr]">
          {residentIsNext && resident?.imageUrl ? (
            <Link href={`/budderlee/residents/${resident.slug}`} className="mx-auto block w-full max-w-xs">
              <Image
                src={resident.imageUrl}
                alt={`${cleanResidentName(resident.name)}, the original painting`}
                width={600}
                height={600}
                sizes="20rem"
                className="h-auto w-full shadow-[0_18px_36px_-24px_rgb(60_40_20/0.55)]"
              />
            </Link>
          ) : (
            <Image src="/budderlee/seal.webp" alt="" width={260} height={260} className="mx-auto mix-blend-multiply" />
          )}
          <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 text-[18px]">
            <dt className="text-on-surface-subtle">Resident</dt>
            <dd>
              {residentIsNext && resident ? (
                <>
                  <Link href={`/budderlee/residents/${resident.slug}`} className="underline decoration-[color:var(--outline)] underline-offset-4">
                    {cleanResidentName(resident.name)}
                  </Link>
                  {resident.role && <span className="italic text-on-surface-subtle">, {resident.role}</span>}
                </>
              ) : (
                <span className="italic">A surprise until the envelope lands</span>
              )}
            </dd>
            <dt className="text-on-surface-subtle">Mails</dt>
            <dd>First week of {schedule.firstMailingLabel}</dd>
            <dt className="text-on-surface-subtle">Sign up by</dt>
            <dd>
              {schedule.signupDeadlineLabel}
              <span className="text-on-surface-subtle"> (the {ordinal(settings.cutoffDay)} of each month)</span>
            </dd>
          </dl>
        </div>
        {canSubscribe && (
          <div className="mt-8 flex justify-center">
            <SignupCountdown
              deadline={schedule.signupDeadline.toISOString()}
              label={<b className="text-on-surface">{`Time left to get the ${schedule.firstMailingLabel.split(" ")[0]} envelope`}</b>}
            />
          </div>
        )}
      </section>

      {/* PRICE AND TERMS */}
      <Rule />
      <section className="mx-auto max-w-5xl px-6 py-14">
        <SectionTitle>Price and terms</SectionTitle>
        <ul className="mt-9 grid gap-6 md:grid-cols-3">
          <li className="rounded-[10px] bg-[#fffdf8] p-6 shadow-[inset_0_0_0_1px_var(--bd-line)]">
            <h3 className="text-[24px]">{price} a month</h3>
            <p className="mt-2 leading-relaxed">
              Charged monthly. Sales tax is added at checkout where the law requires it.
            </p>
          </li>
          <li className="rounded-[10px] bg-[#fffdf8] p-6 shadow-[inset_0_0_0_1px_var(--bd-line)]">
            <h3 className="text-[24px]">Shipping included</h3>
            <p className="mt-2 leading-relaxed">
              Mailed to U.S. addresses in the first week of each month, at no extra cost.
            </p>
          </li>
          <li className="rounded-[10px] bg-[#fffdf8] p-6 shadow-[inset_0_0_0_1px_var(--bd-line)]">
            <h3 className="text-[24px]">Cancel any time</h3>
            <p className="mt-2 leading-relaxed">
              {`One link in your emails. Cancel before the ${ordinal(settings.cutoffDay)} and you won't be charged again.`}
            </p>
          </li>
        </ul>
      </section>

      {/* FOUNDING MEMBER GIFT */}
      {founding && settings.phase !== "closed" && (
        <section className="bg-[color:var(--bd-sage)] px-6 py-12 text-center">
          <h2 className="text-[32px] leading-tight">Founding Member gift</h2>
          <Ornament />
          <p className="mx-auto mt-4 max-w-xl text-[18px] leading-relaxed">
            {`Subscribe by ${founding.label}, and your first envelope includes the Walter iron-on: an exclusive, one-time design that won't be printed again. It comes in addition to everything above.`}
          </p>
        </section>
      )}

      {/* SIGN UP */}
      <section id="signup" className="mx-auto max-w-3xl scroll-mt-6 px-6 py-14">
        <div className="mb-8 text-center">
          <SectionTitle>{canSubscribe ? "Subscribe" : settings.phase === "closed" ? "Signups closed" : full ? "Full for now" : "Join the waitlist"}</SectionTitle>
          <p className="mt-4 text-[22px] leading-snug">{headline}</p>
          <p className="mx-auto mt-3 max-w-xl leading-relaxed text-on-surface-muted">
            {canSubscribe
              ? schedule.chargesNow
                ? `Subscribe today and your first package mails in the first week of ${schedule.firstMailingLabel}. Your card is charged now and renews on the same day each month.`
                : `The ${ordinal(settings.cutoffDay)} has passed this month, so nothing is charged today: your card is charged on ${schedule.chargeDateLabel} and your first package mails in the first week of ${schedule.firstMailingLabel}.`
              : settings.phase === "closed"
                ? "Leave your email and you'll be the first to know if The Budderlee Post opens again."
                : full
                  ? `${settings.subscriberCap} packages a month is all Barbara can pack by hand. Leave your email and you'll hear first when a spot opens.`
                  : `Leave your email and you'll hear from Barbara before anyone else when signups open. The first ${settings.subscriberCap} subscribers are all she can pack in a month, so the waitlist goes first.`}
          </p>
        </div>
        {canSubscribe ? (
          <>
            <SubscribeButton label={`Subscribe for ${price} a month`} />
            <p className="mt-6 text-center text-xs text-on-surface-subtle">
              Secure checkout by Stripe. U.S. addresses only. Sales tax is added where it applies. Change your address or card, or cancel any time, from a link in your emails.
            </p>
          </>
        ) : (
          <>
            <WaitlistForm />
            <p className="mt-6 text-center text-xs text-on-surface-subtle">
              This list is only for {BUDDERLEE_POST.name}. It&rsquo;s separate from the studio newsletter.
            </p>
          </>
        )}
      </section>

      {/* FAQ */}
      <Rule />
      <section className="mx-auto max-w-3xl px-6 py-14">
        <SectionTitle>Questions, answered</SectionTitle>
        <dl className="mt-9">
          {FAQ.map((f) => (
            <div key={f.q} className="border-t border-[color:var(--bd-line)] py-5">
              <dt className="text-[22px] leading-tight text-on-surface">{f.q}</dt>
              <dd className="mt-2 leading-relaxed text-on-surface-muted">
                {f.a(settings.nextMailing, settings.cutoffDay, founding?.label)}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-10 text-center text-on-surface-subtle">
          Already subscribed?{" "}
          <Link href="/budderlee/post/manage" className="underline underline-offset-4">
            Manage your subscription
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
