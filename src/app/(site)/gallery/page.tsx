import { Suspense } from "react";
import { getAllPaintings, getAvailableSubjectGroups } from "@/data/paintings";
import { GalleryList } from "@/components/gallery-list";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { Blob } from "@/components/ui/blob";

export const metadata = { title: "Gallery" };

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
            eyebrow="Gallery of personalities"
            title={
              <>
                Every animal Barbara has
                <br className="hidden md:block" /> ever fallen for.
              </>
            }
            lede="Each piece is an original. When it sells it leaves the gallery — sold work stays on the page for reference and the inevitable 'could you paint something similar?' conversation."
          />
        </div>
      </Section>

      <Section tone="low" pad="lg">
        <Suspense fallback={null}>
          <GalleryList paintings={paintings} groups={groups} />
        </Suspense>
      </Section>
    </>
  );
}
