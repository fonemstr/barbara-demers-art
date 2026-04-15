import Image from "next/image";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <header className="mb-10">
        <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground mb-4">
          About the artist
        </p>
        <h1 className="font-serif text-4xl md:text-5xl">Barbara J Demers</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="md:col-span-1">
          <div className="relative aspect-[4/5] bg-muted">
            <Image
              src="/paintings/placeholder-3.svg"
              alt="Barbara J Demers in the studio"
              fill
              sizes="(min-width: 768px) 33vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className="md:col-span-2 prose prose-lg max-w-none">
          <p>
            Barbara J Demers is a painter working primarily in oil, focused on
            the animals she has known and observed up close — foxes at the
            edge of the treeline, barn owls in rafter light, the horses of
            neighboring pastures.
          </p>
          <p>
            Her work sits in the realist tradition but is built with loose,
            confident brushwork. She paints from life and from her own
            reference photography, layering thin glazes to develop the
            quiet, inward mood her collectors return for.
          </p>
          <p>
            Each painting in the gallery is an original, signed, and
            shipped directly from the studio. Commissions are accepted a
            few times a year — if you have an animal you&rsquo;d like to
            remember, the conversation starts on the{" "}
            <a href="/commissions">commissions page</a>.
          </p>
          <p className="text-sm text-muted-foreground italic">
            (Placeholder bio — replace with your own text in{" "}
            <code>src/app/about/page.tsx</code>.)
          </p>
        </div>
      </div>
    </div>
  );
}
