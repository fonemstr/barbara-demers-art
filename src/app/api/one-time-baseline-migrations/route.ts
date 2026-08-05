import { NextResponse } from "next/server";
import { getPayload } from "payload";
import { sql } from "@payloadcms/db-postgres";
import config from "@payload-config";

export const dynamic = "force-dynamic";

// One-time production fix. The live database was schema-synced by Payload's
// dev mode at some point, which left a `batch: -1` marker in
// payload_migrations. That marker makes `payload migrate` show an
// interactive y/N prompt, which silently answers "No" in Vercel's
// non-interactive build — so the 20260805 print-options migration never
// ran and the site fell back to seed data.
//
// This route baselines the database in one shot, all idempotent:
//   1. creates paintings_print_options if missing (additive, no data touched)
//   2. deletes the batch -1 dev marker so builds stop prompting
//   3. records every migration as applied, since the schema then matches them
//
// Usage (once, then delete this file):
//   curl -X POST https://<domain>/api/one-time-baseline-migrations \
//     -H "x-baseline-secret: $PAYLOAD_SECRET"

const MIGRATION_NAMES = [
  "20260418_221212_initial",
  "20260525_add_painting_story",
  "20260728_104917_add_free_shipping_tier",
  "20260805_add_print_options",
];

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.json({ error: "Only available in production." }, { status: 404 });
  }
  const secret = request.headers.get("x-baseline-secret");
  if (!process.env.PAYLOAD_SECRET || secret !== process.env.PAYLOAD_SECRET) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const payload = await getPayload({ config });
  const db = payload.db.drizzle;

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "paintings_print_options" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "width_in" numeric NOT NULL,
      "height_in" numeric NOT NULL,
      "price_cents" numeric NOT NULL
    );
  `);
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "paintings_print_options"
        ADD CONSTRAINT "paintings_print_options_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."paintings"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "paintings_print_options_order_idx"
      ON "paintings_print_options" USING btree ("_order");
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "paintings_print_options_parent_id_idx"
      ON "paintings_print_options" USING btree ("_parent_id");
  `);

  const devMarker = await db.execute(sql`
    DELETE FROM "payload_migrations" WHERE "batch" = -1 RETURNING "name";
  `);

  const recorded: string[] = [];
  for (const name of MIGRATION_NAMES) {
    const inserted = await db.execute(sql`
      INSERT INTO "payload_migrations" ("name", "batch")
      SELECT ${name}, 1
      WHERE NOT EXISTS (
        SELECT 1 FROM "payload_migrations" WHERE "name" = ${name}
      )
      RETURNING "name";
    `);
    if (inserted.rows.length) recorded.push(name);
  }

  return NextResponse.json({
    ok: true,
    devMarkersDeleted: devMarker.rows.length,
    migrationsRecorded: recorded,
  });
}
