import { paintings } from "@/data/paintings";
import { PaintingCard } from "@/components/painting-card";

export const metadata = { title: "Gallery" };

export default function GalleryPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <header className="mb-12 max-w-2xl">
        <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground mb-4">
          Gallery
        </p>
        <h1 className="font-serif text-4xl md:text-5xl">All work</h1>
        <p className="mt-4 text-muted-foreground">
          Each painting is an original. When a piece sells it leaves the
          gallery — sold work is left here for reference.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {paintings.map((painting) => (
          <PaintingCard key={painting.slug} painting={painting} />
        ))}
      </div>
    </div>
  );
}
