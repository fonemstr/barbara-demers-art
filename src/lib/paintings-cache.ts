// The painting list is cached in Next's data cache under this tag so page
// renders don't re-query Postgres. Every page reads it (the site layout
// included), and on Neon's free plan each read counts against the monthly
// network transfer allowance.
export const PAINTINGS_TAG = "paintings";

// Expire the cached painting list so the next read goes to the database.
// Lazy-imported so `payload` CLI runs (migrations, etc.) don't pull in
// Next's runtime, and it never fails a write outside a Next request.
export async function expirePaintingsCache() {
  try {
    const { revalidateTag } = await import("next/cache");
    // expire: 0 (not "max") so the pages revalidatePath rebuilds right after
    // an edit read fresh data instead of the stale entry.
    revalidateTag(PAINTINGS_TAG, { expire: 0 });
  } catch {
    // outside a request context (scripts, migrations) — nothing to do
  }
}
