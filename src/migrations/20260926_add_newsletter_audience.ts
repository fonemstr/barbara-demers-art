import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Which studio-list topic a newsletter goes to. Existing rows become "all".
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
    CREATE TYPE "public"."enum_newsletters_audience" AS ENUM('all', 'artwork', 'budderlee');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  ALTER TABLE "newsletters" ADD COLUMN IF NOT EXISTS "audience" "enum_newsletters_audience" DEFAULT 'all' NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "newsletters" DROP COLUMN IF EXISTS "audience";
  DROP TYPE IF EXISTS "public"."enum_newsletters_audience";
  `)
}
