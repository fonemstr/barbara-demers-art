import type { Payload } from "payload";

// Lazy-loaded Payload client. Returns null in dev if POSTGRES_URL is not
// set, which lets the rest of the site render from the static seed files
// without requiring a running database.
let cached: Payload | null | undefined;

export async function getPayloadClient(): Promise<Payload | null> {
  if (cached !== undefined) return cached;

  const hasDb = !!(process.env.POSTGRES_URL || process.env.DATABASE_URL);
  if (!hasDb) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[payload] POSTGRES_URL not set — falling back to static seed data. Set POSTGRES_URL in .env.local to use the admin.",
      );
    }
    cached = null;
    return cached;
  }

  try {
    const { getPayload } = await import("payload");
    const config = (await import("@payload-config")).default;
    cached = await getPayload({ config });
    return cached;
  } catch (err) {
    console.error("[payload] Failed to initialize:", err);
    cached = null;
    return cached;
  }
}
