import Link from "next/link";
import { Section } from "@/components/ui/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ButtonLink } from "@/components/ui/button";

// Branded 404 inside the site layout, so stale links land somewhere useful.
export function NotFoundContent() {
  return (
    <Section tone="surface" pad="lg" maxWidth="3xl">
      <div className="text-center">
        <Eyebrow>Page not found</Eyebrow>
        <h1 className="mt-4 font-serif text-3xl md:text-5xl leading-[1.1] tracking-[-0.015em] text-on-surface text-balance">
          That one must have wandered off.
        </h1>
        <p className="mt-5 text-lg text-on-surface-muted leading-relaxed">
          The page you were looking for isn&apos;t here. The paintings are,
          though.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <ButtonLink href="/gallery" size="md">
            View available work
          </ButtonLink>
          <ButtonLink href="/budderlee" size="md" variant="secondary">
            Meet the Residents of Budderlee
          </ButtonLink>
        </div>
        <p className="mt-8 text-sm text-on-surface-subtle">
          <Link href="/" className="underline underline-offset-4">
            Back to the studio
          </Link>
        </p>
      </div>
    </Section>
  );
}
