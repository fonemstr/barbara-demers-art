import { Residents3D } from "@/components/budderlee-world/residents-3d";
import { Section } from "@/components/ui/section";
import { Eyebrow } from "@/components/ui/eyebrow";

// Unlisted: a page to share with Barbara for feedback on the 3D residents.
// Not linked from the site and kept out of search results.
export const metadata = {
  title: "The Residents in 3D",
  robots: { index: false, follow: false },
};

export default function Residents3DPage() {
  return (
    <Section tone="surface" pad="md">
      <header className="mb-10 grid gap-3 max-w-2xl">
        <Eyebrow>The village of Budderlee</Eyebrow>
        <h1 className="font-serif text-3xl md:text-5xl leading-[1.1] tracking-[-0.015em] text-balance">
          The residents, <em className="font-normal italic text-primary">in three dimensions</em>
        </h1>
        <p className="text-lg text-on-surface-muted leading-relaxed text-pretty">
          Each of these little figures was sculpted from one of your paintings. Drag to turn them around, and pinch or scroll to look closer.
        </p>
      </header>
      <Residents3D />
      <p className="mt-10 max-w-2xl text-on-surface-muted">
        These are first drafts. If a coat is the wrong colour or a face doesn&rsquo;t look like the painting, say which one and it can be remade.
      </p>
    </Section>
  );
}
