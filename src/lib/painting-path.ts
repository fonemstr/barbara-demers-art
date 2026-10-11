// Where a painting lives on the site: Budderlee residents have their own
// pages in the Budderlee section; everything else is in the gallery.
export function paintingPath(p: { slug: string; collection?: string | null }): string {
  return p.collection === "budderlee" ? `/budderlee/residents/${p.slug}` : `/gallery/${p.slug}`;
}
