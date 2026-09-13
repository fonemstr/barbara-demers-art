import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { ArtistNote } from "@/components/ui/artist-note";
import { Section } from "@/components/ui/section";
import { Blob } from "@/components/ui/blob";
import { stripe } from "@/lib/stripe";
import { BUDDERLEE_POST, getBudderleePostSettings, getSignupSchedule } from "@/lib/budderlee-post";

export const metadata = {
  title: `Welcome to ${BUDDERLEE_POST.name}`,
  robots: { index: false, follow: false },
};

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  const settings = await getBudderleePostSettings();
  const schedule = getSignupSchedule(settings.cutoffDay);

  let email: string | null = null;
  let chargesNow = schedule.chargesNow;
  let firstMailing = schedule.firstMailingLabel;
  if (stripe && session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      email = session.customer_details?.email ?? null;
      if (session.metadata?.first_mailing) firstMailing = session.metadata.first_mailing;
      if (session.metadata?.charges_now) chargesNow = session.metadata.charges_now === "1";
    } catch (err) {
      console.error("[post/welcome] could not read session:", err);
    }
  }

  const steps = [
    {
      title: chargesNow ? "Charged today" : `Charged on ${schedule.chargeDateLabel}`,
      body: chargesNow
        ? "Your card was charged for the first package just now, and renews on the same day each month."
        : "Nothing was charged today. Your first charge lands on the cutoff, and it renews monthly from there.",
    },
    {
      title: `First package: ${firstMailing}`,
      body: "Packages leave the studio in the first week of the month, packed by hand.",
    },
    {
      title: "Manage it from your inbox",
      body: "Update your address or card, pause, or cancel from a link sent to your email. No account to keep track of.",
    },
  ];

  return (
    <>
      <Section tone="surface" pad="md" maxWidth="3xl" className="overflow-hidden">
        <Blob size={360} color="var(--surface-variant)" style={{ left: "50%", top: -60, transform: "translateX(-50%)", opacity: 0.6 }} />
        <Blob size={220} color="var(--secondary-container)" style={{ right: -40, top: 80, opacity: 0.5 }} />
        <div className="relative z-10 text-center">
          <ArtistNote icon="✉️" className="mx-auto">You&rsquo;re in.</ArtistNote>
          <h1 className="mt-6 font-serif text-3xl md:text-5xl leading-[1.1] tracking-[-0.015em] text-balance">
            Welcome to {BUDDERLEE_POST.name}.
          </h1>
          <p className="mt-6 text-lg text-on-surface-muted leading-relaxed text-pretty">
            {email ? `A welcome note is on its way to ${email}, and Stripe has sent your receipt.` : "A welcome note is on its way, and Stripe has sent your receipt."}{" "}
            Your first resident arrives in the first week of {firstMailing}.
          </p>
        </div>
      </Section>

      <Section tone="low" pad="md" maxWidth="4xl">
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((t) => (
            <li key={t.title} className="rounded-[var(--radius-lg)] bg-surface-container-lowest p-6">
              <h2 className="font-serif text-xl leading-tight text-on-surface">{t.title}</h2>
              <p className="mt-3 text-[15px] text-on-surface-muted leading-relaxed">{t.body}</p>
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <ButtonLink href="/budderlee" variant="secondary">Meet the residents</ButtonLink>
          <Link href="/budderlee/post/manage" className="text-sm text-on-surface-muted underline underline-offset-4">
            Manage my subscription
          </Link>
        </div>
      </Section>
    </>
  );
}
