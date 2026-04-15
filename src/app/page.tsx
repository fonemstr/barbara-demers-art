import Link from "next/link";
import { getFeaturedPaintings } from "@/data/paintings";
import { PaintingCard } from "@/components/painting-card";
import { NewsletterForm } from "@/components/newsletter-form";

export default async function HomePage() {
  const featured = await getFeaturedPaintings(3);

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-24">
        <div className="max-w-3xl">
          <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground mb-6">
            Original animal paintings
          </p>
          <h1 className="font-serif text-5xl md:text-7xl leading-[1.05] text-foreground">
            Quiet studies of<br />
            the creatures we love.
          </h1>
          <p className="mt-8 text-lg text-muted-foreground max-w-xl leading-relaxed">
            Barbara Demers paints oils of foxes, otters, barn owls, and the
            horses of her corner of the world. Each piece is one of a kind,
            available here in the studio.
          </p>
          <div className="mt-10 flex gap-4">
            <Link
              href="/gallery"
              className="inline-flex items-center px-6 py-3 bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
            >
              View the gallery
            </Link>
            <Link
              href="/commissions"
              className="inline-flex items-center px-6 py-3 border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              Commission a piece
            </Link>
          </div>
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="flex items-end justify-between mb-10">
            <h2 className="font-serif text-3xl md:text-4xl">Currently in the studio</h2>
            <Link
              href="/gallery"
              className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              See all work
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featured.map((painting) => (
              <PaintingCard key={painting.slug} painting={painting} />
            ))}
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="border-y border-border bg-muted">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="font-serif text-3xl md:text-4xl">Join the studio list</h2>
          <p className="mt-4 text-muted-foreground">
            Occasional notes from the easel — new paintings, commissions
            reopening, and the occasional progress photo.
          </p>
          <div className="mt-8 max-w-md mx-auto">
            <NewsletterForm />
          </div>
        </div>
      </section>
    </div>
  );
}
