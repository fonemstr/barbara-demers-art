import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Per-size Lumaprints fulfillment settings on painting print options.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "paintings_print_options" ADD COLUMN IF NOT EXISTS "lumaprints" boolean DEFAULT false;
  ALTER TABLE "paintings_print_options" ADD COLUMN IF NOT EXISTS "lumaprints_subcategory_id" numeric DEFAULT 103001;
  ALTER TABLE "paintings_print_options" ADD COLUMN IF NOT EXISTS "lumaprints_options" varchar DEFAULT '0.50in Bleed';
  ALTER TABLE "paintings_print_options" ADD COLUMN IF NOT EXISTS "print_file_id" integer;
  ALTER TABLE "paintings_print_options" ADD CONSTRAINT "paintings_print_options_print_file_id_media_id_fk" FOREIGN KEY ("print_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX IF NOT EXISTS "paintings_print_options_print_file_idx" ON "paintings_print_options" USING btree ("print_file_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "paintings_print_options" DROP CONSTRAINT IF EXISTS "paintings_print_options_print_file_id_media_id_fk";
  DROP INDEX IF EXISTS "paintings_print_options_print_file_idx";
  ALTER TABLE "paintings_print_options" DROP COLUMN IF EXISTS "print_file_id";
  ALTER TABLE "paintings_print_options" DROP COLUMN IF EXISTS "lumaprints_options";
  ALTER TABLE "paintings_print_options" DROP COLUMN IF EXISTS "lumaprints_subcategory_id";
  ALTER TABLE "paintings_print_options" DROP COLUMN IF EXISTS "lumaprints";
  `)
}
