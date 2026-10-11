import { getResidents } from "@/data/paintings";
import { SectionTitle } from "@/components/budderlee/parts";
import { ResidentCard } from "@/components/budderlee/resident-card";
import { JsonLd } from "@/components/json-ld";
import { collectionGraph } from "@/lib/schema";

export const metadata = {
  title: "Meet the Residents of Budderlee",
  alternates: { canonical: "/budderlee/residents" },
  description:
    "Every resident of Budderlee begins as a one-of-a-kind 5×5 inch original painting by Barbara J. Demers. Meet them all, see which originals are still available, and find prints.",
};

export const revalidate = 60;

export default async function ResidentsPage() {
  const residents = await getResidents();
  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <JsonLd
        data={collectionGraph({
          path: "/budderlee/residents",
          name: "The Residents of Budderlee",
          description: metadata.description,
          image: "/budderlee/seal.webp",
          itemPaths: residents.map((p) => `/budderlee/residents/${p.slug}`),
        })}
      />
      <SectionTitle as="h1">Meet the Residents</SectionTitle>
      <div className="mx-auto mt-5 max-w-2xl space-y-3 text-center text-lg leading-relaxed">
        <p>
          Every resident of Budderlee begins as a one-of-a-kind 5×5 inch original painting by
          Barbara J. Demers. Each has a name, a job in the village, a birthday and friends down the
          lane.
        </p>
        <p className="text-[15px] italic text-on-surface-subtle">
          Photos show each painting in a themed scene. The frame and setting are for display only.
        </p>
      </div>
      {residents.length === 0 ? (
        <p className="mt-12 text-center italic">The first residents are moving in.</p>
      ) : (
        <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {residents.map((p) => (
            <ResidentCard key={p.slug} painting={p} showNumber />
          ))}
        </div>
      )}
    </section>
  );
}
