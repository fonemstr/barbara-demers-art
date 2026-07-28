import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// NOTE: the auto-generated version of this migration also re-added
// story_behind_painting because 20260525_add_painting_story.ts was written
// by hand without a schema snapshot. That column already exists in
// production, so this migration is trimmed to just the enum change.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_paintings_size_tier" ADD VALUE 'free' BEFORE 'small';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paintings" ALTER COLUMN "size_tier" SET DATA TYPE text;
  ALTER TABLE "paintings" ALTER COLUMN "size_tier" SET DEFAULT 'medium'::text;
  DROP TYPE "public"."enum_paintings_size_tier";
  CREATE TYPE "public"."enum_paintings_size_tier" AS ENUM('small', 'medium', 'large', 'oversize');
  ALTER TABLE "paintings" ALTER COLUMN "size_tier" SET DEFAULT 'medium'::"public"."enum_paintings_size_tier";
  ALTER TABLE "paintings" ALTER COLUMN "size_tier" SET DATA TYPE "public"."enum_paintings_size_tier" USING "size_tier"::"public"."enum_paintings_size_tier";`)
}
