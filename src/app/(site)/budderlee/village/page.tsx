import Link from "next/link";
import { ScrollWorld } from "@/components/budderlee-world/scroll-world";
import { VILLAGE_SECTIONS } from "@/components/budderlee-world/sections";
import { getResidents, residentName } from "@/data/paintings";
import { BdButton, Ornament, Rule, SectionTitle } from "@/components/budderlee/parts";

export const metadata = {
  title: "Explore the Village of Budderlee",
  alternates: { canonical: "/budderlee/village" },
  description:
    "Fly into Budderlee, a little clay-diorama village where Barbara J Demers' painted animal residents live, shop and gather under the Budderlee Tree.",
  openGraph: {
    type: "website",
    siteName: "Barbara J Demers",
    title: "Explore the Village of Budderlee",
    description: "Fly into Budderlee and meet its painted animal residents under the Budderlee Tree.",
    images: [
      {
        url: "/budderlee/world/village.webp",
        alt: "The village of Budderlee as a little clay diorama, with its residents out and about",
      },
    ],
  },
};

export const revalidate = 60;

export default async function BudderleeVillagePage() {
  // Residents named in the guide link to their pages when they have one.
  const residents = await getResidents();
  const bySlug = new Map(residents.map((p) => [residentName(p).toLowerCase(), p.slug]));

  return (
    <>
      <section className="mx-auto max-w-3xl px-6 pb-6 pt-12 text-center">
        <SectionTitle as="h1">Explore the Village</SectionTitle>
        <p className="mt-4 text-lg leading-relaxed">
          Scroll down slowly to fly into Budderlee. The camera swoops over the village, then
          visits the green, Market Street, the station, the orchard and Potter&rsquo;s Row. Scroll
          back up to fly the other way. On a phone, swipe up.
        </p>
        <p className="mt-3 text-[15px] italic text-on-surface-subtle">
          Prefer to read? <a href="#around-the-village" className="underline underline-offset-4">Skip to the guide below</a>.
        </p>
      </section>

      <ScrollWorld />

      <section id="around-the-village" className="mx-auto max-w-4xl scroll-mt-6 px-6 py-14">
        <SectionTitle>Around the village</SectionTitle>
        <ol className="mt-8">
          {VILLAGE_SECTIONS.map((place, i) => (
            <li key={place.id} className="grid gap-2 border-t border-[color:var(--bd-line)] py-6 md:grid-cols-[13rem_1fr] md:gap-8">
              <div>
                <p className="text-[12px] uppercase tracking-[0.22em] text-on-surface-faint">Stop {i + 1}</p>
                <h3 className="text-[26px] leading-tight">{place.label}</h3>
              </div>
              <div>
                <p className="text-[18px] italic text-on-surface-muted">{place.title}</p>
                <p className="mt-1 text-[17px] leading-relaxed">{place.body}</p>
                {place.tags && place.tags.length > 0 && (
                  <p className="mt-2 text-[15px] text-on-surface-subtle">
                    Who you&rsquo;ll meet:{" "}
                    {place.tags.map((name, j) => {
                      const slug = bySlug.get(name.toLowerCase());
                      return (
                        <span key={name}>
                          {j > 0 && ", "}
                          {slug ? (
                            <Link href={`/budderlee/residents/${slug}`} className="underline decoration-[color:var(--outline)] underline-offset-4 hover:text-on-surface">
                              {name}
                            </Link>
                          ) : (
                            name
                          )}
                        </span>
                      );
                    })}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <Rule />
      <section className="px-6 py-12 text-center">
        <Ornament />
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <BdButton href="/budderlee/residents">Meet the Residents</BdButton>
          <BdButton href="/budderlee/tales" outline>
            Read the Tales
          </BdButton>
          <BdButton href="/budderlee/post" outline>
            Discover the Post
          </BdButton>
        </div>
      </section>
    </>
  );
}
