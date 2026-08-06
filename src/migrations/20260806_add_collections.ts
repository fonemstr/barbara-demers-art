import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
    CREATE TYPE "public"."enum_paintings_collection" AS ENUM('none', 'meadowbrook');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  ALTER TABLE "paintings" ADD COLUMN IF NOT EXISTS "collection" "enum_paintings_collection" DEFAULT 'none';
  ALTER TABLE "paintings" ADD COLUMN IF NOT EXISTS "character_name" varchar;
  ALTER TABLE "paintings" ADD COLUMN IF NOT EXISTS "character_role" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "paintings" DROP COLUMN IF EXISTS "collection";
  ALTER TABLE "paintings" DROP COLUMN IF EXISTS "character_name";
  ALTER TABLE "paintings" DROP COLUMN IF EXISTS "character_role";
  DROP TYPE IF EXISTS "public"."enum_paintings_collection";
  `)
}
