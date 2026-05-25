import { NextResponse } from "next/server";
import { Pool } from "pg";

const REPAIR_TOKEN = "repair-painting-schema-2026-05-25-c78f35b7";
const MIGRATION_NAME = "20260525_184500_painting_show_fields";

const connectionString =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

export async function POST(request: Request) {
  const token = request.headers.get("x-repair-token");
  if (token !== REPAIR_TOKEN) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!connectionString) {
    return NextResponse.json(
      { error: "No Postgres connection string is configured" },
      { status: 500 },
    );
  }

  const pool = new Pool({ connectionString });

  try {
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."enum_paintings_images_role" AS ENUM('main', 'detail', 'scale', 'signature');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "public"."enum_paintings_availability_status" AS ENUM('available', 'reserved', 'sold', 'comingSoon', 'inStudio');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "public"."enum_paintings_price_display" AS ENUM('visible', 'inquire', 'hidden');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      ALTER TABLE "paintings_images"
        ADD COLUMN IF NOT EXISTS "role" "enum_paintings_images_role" DEFAULT 'detail',
        ADD COLUMN IF NOT EXISTS "caption" varchar;

      ALTER TABLE "paintings"
        ADD COLUMN IF NOT EXISTS "story_teaser" varchar,
        ADD COLUMN IF NOT EXISTS "story" varchar,
        ADD COLUMN IF NOT EXISTS "availability_status" "enum_paintings_availability_status" DEFAULT 'available' NOT NULL,
        ADD COLUMN IF NOT EXISTS "price_display" "enum_paintings_price_display" DEFAULT 'visible' NOT NULL,
        ADD COLUMN IF NOT EXISTS "availability_note" varchar;

      UPDATE "paintings"
        SET "availability_status" = 'sold'
        WHERE "sold" = true AND "availability_status" <> 'sold';

      INSERT INTO "payload_migrations" ("name", "batch", "updated_at", "created_at")
      SELECT '${MIGRATION_NAME}', 2, NOW(), NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM "payload_migrations" WHERE "name" = '${MIGRATION_NAME}'
      );
    `);

    return NextResponse.json({ ok: true, migration: MIGRATION_NAME });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Repair failed";
    console.error("[repair-painting-schema]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await pool.end();
  }
}
