import { getAllPaintings, getAvailableSubjectGroups } from "@/data/paintings";
import { GalleryList } from "@/components/gallery-list";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { Blob } from "@/components/ui/blob";

export const metadata = {
  title: "Available Work",
  alternates: { canonical: "/gallery" },
};

// Re-generate at most once a minute so new paintings appear without a
// redeploy.
export const revalidate = 60;

export default async function GalleryPage() {
  const [paintings, groups] = await Promise.all([
    getAllPaintings(),
    getAvailableSubjectGroups(),
  ]);

  return (
    <>
      <Section tone="surface" pad="md" className="overflow-hidden">
        <Blob
          size={420}
          color="var(--surface-variant)"
          style={{ right: -120, top: -60, opacity: 0.7 }}
        />
        <div className="relative z-10">
          <PageHeader
            eyebrow="Available originals and archive"
            title={
              <>
                Expressive realism paintings
                <br className="hidden md:block" /> that ask us to look again.
              </>
            }
            lede="Each piece is an original with its own title, story, and point of view. Available paintings may be purchased directly; sold work remains as an archive of the studio's ongoing conversation with animals, insects, and the natural world."
          />
        </div>
      </Section>

      <Section tone="low" pad="lg">
        <GalleryList paintings={paintings} groups={groups} />
      </Section>
    </>
  );
}
