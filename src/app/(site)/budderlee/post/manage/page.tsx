import { ManageForm } from "@/components/manage-form";
import { ArtistNote } from "@/components/ui/artist-note";
import { Section } from "@/components/ui/section";
import { Blob } from "@/components/ui/blob";
import { BUDDERLEE_POST } from "@/lib/budderlee-post";

export const metadata = {
  title: `Manage your ${BUDDERLEE_POST.name} subscription`,
  alternates: { canonical: "/budderlee/post/manage" },
  description: "Update your address or card, pause, or cancel your Budderlee Post subscription.",
};

export default async function ManagePage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; expired?: string; error?: string }>;
}) {
  const q = await searchParams;
  const note = q.done
    ? "All set. Any changes you made are saved."
    : q.expired
      ? "That link has expired. Ask for a fresh one below."
      : q.error
        ? "Something went wrong opening your subscription. Ask for a fresh link below, or reply to any of Barbara's emails."
        : null;

  return (
    <Section tone="surface" pad="md" maxWidth="3xl" className="overflow-hidden">
      <Blob size={360} color="var(--surface-variant)" style={{ left: "50%", top: -60, transform: "translateX(-50%)", opacity: 0.6 }} />
      <div className="relative z-10">
        <div className="text-center">
          <ArtistNote icon="✉️" className="mx-auto">{BUDDERLEE_POST.name}</ArtistNote>
          <h1 className="mt-6 font-serif text-3xl md:text-5xl leading-[1.1] tracking-[-0.015em] text-balance">
            Manage your subscription.
          </h1>
          <p className="mt-6 text-lg text-on-surface-muted leading-relaxed text-pretty">
            Enter the email you subscribed with and we&rsquo;ll send a secure link.
            From there you can update your address or card, pause, or cancel.
          </p>
          {note && (
            <p className="mt-4 inline-block rounded-full bg-surface-container-highest px-4 py-2 text-sm text-on-surface" role="status">
              {note}
            </p>
          )}
        </div>
        <div className="mt-8 mx-auto max-w-md">
          <ManageForm />
        </div>
        <p className="mt-6 text-center text-xs text-on-surface-subtle">
          Changes made before the 15th apply to the next mailing.
        </p>
      </div>
    </Section>
  );
}
