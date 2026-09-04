import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";

export const metadata = {
  title: "Privacy Policy",
  description:
    "What barbarajdemers.com collects, why, and who handles it. Plain-language privacy policy for the studio site of painter Barbara J Demers.",
  alternates: { canonical: "/privacy" },
};

// Keep this date current when the policy text changes.
const LAST_UPDATED = "September 4, 2026";

const SECTIONS: { heading: string; body: React.ReactNode }[] = [
  {
    heading: "What this site collects",
    body: (
      <>
        <p>
          Most of the site can be browsed without giving any personal information.
          You share details only when you choose to use one of these features:
        </p>
        <ul className="mt-4 list-disc pl-6 space-y-2">
          <li>
            <strong>Collector list signup.</strong> Your email address, so the
            studio can send occasional news about new paintings and commissions.
          </li>
          <li>
            <strong>Commission inquiry.</strong> Your name, email, the subject you
            have in mind, a size, a timeline, and your message.
          </li>
          <li>
            <strong>Buying a painting or print.</strong> Your name, email, shipping
            address, and payment details, entered on a checkout page run by Stripe.
            Card numbers go to Stripe directly and are never stored on this site.
          </li>
        </ul>
      </>
    ),
  },
  {
    heading: "How it is used",
    body: (
      <p>
        Only for the purpose you gave it: to reply to your inquiry, to ship and
        support your order, or to send the newsletter you asked for. Nothing is
        sold, rented, or shared for advertising. Every newsletter includes an
        unsubscribe link, and unsubscribing takes effect immediately.
      </p>
    ),
  },
  {
    heading: "Services that handle data on the studio's behalf",
    body: (
      <>
        <p>
          A small number of providers keep the site running. Each one receives
          only what it needs to do its job:
        </p>
        <ul className="mt-4 list-disc pl-6 space-y-2">
          <li>
            <strong>Stripe</strong> processes payments and collects shipping
            addresses at checkout.
          </li>
          <li>
            <strong>Resend</strong> stores the collector list and delivers email,
            including commission inquiries sent to the studio.
          </li>
          <li>
            <strong>Vercel</strong> hosts the site and its image files, and
            provides Vercel Web Analytics.
          </li>
          <li>
            <strong>Neon</strong> hosts the database behind the gallery and journal.
          </li>
        </ul>
      </>
    ),
  },
  {
    heading: "Analytics and cookies",
    body: (
      <p>
        The site uses Vercel Web Analytics, which counts page views and referrers
        in aggregate. It does not use cookies, does not fingerprint your device,
        and does not follow you to other sites. No advertising or tracking
        cookies are set for visitors. The only cookie the site uses is a login
        session for the studio&rsquo;s own admin area, which visitors never receive.
      </p>
    ),
  },
  {
    heading: "Social media",
    body: (
      <p>
        The studio publishes new paintings to its own Instagram, Facebook, and
        Pinterest accounts from this site. That connection only sends the
        studio&rsquo;s posts outward. It does not read, collect, or store any
        information about people who follow, like, or interact with those
        accounts. Your activity on those platforms is governed by their own
        privacy policies.
      </p>
    ),
  },
  {
    heading: "How long information is kept",
    body: (
      <p>
        Newsletter addresses stay on the list until you unsubscribe. Commission
        inquiries are kept in email as long as the conversation is useful, then
        deleted. Order records are kept for as long as tax and accounting rules
        require.
      </p>
    ),
  },
  {
    heading: "Your choices",
    body: (
      <p>
        You can ask to see what the studio holds about you, have it corrected, or
        have it deleted. Send the request through the{" "}
        <Link href="/commissions" className="underline underline-offset-4 hover:text-on-surface">
          contact form
        </Link>{" "}
        and it will be handled within 30 days.
      </p>
    ),
  },
  {
    heading: "Children",
    body: (
      <p>
        The site is not directed at children under 13 and does not knowingly
        collect information from them.
      </p>
    ),
  },
  {
    heading: "Changes",
    body: (
      <p>
        If this policy changes, the new version will be posted here with an
        updated date at the top.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Section tone="surface" pad="md" maxWidth="3xl">
        <PageHeader
          eyebrow={`Last updated ${LAST_UPDATED}`}
          title="Privacy policy"
          lede="This is the studio website of painter Barbara J Demers. It collects very little, and this page explains all of it in plain language."
        />
      </Section>

      <Section tone="surface" pad="smt" maxWidth="3xl">
        <div className="flex flex-col gap-12 text-[17px] leading-[1.7] text-on-surface-muted">
          {SECTIONS.map((section) => (
            <section key={section.heading}>
              <h2 className="font-serif text-2xl text-on-surface mb-4">
                {section.heading}
              </h2>
              {section.body}
            </section>
          ))}
        </div>
      </Section>
    </>
  );
}
