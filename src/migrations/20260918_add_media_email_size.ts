import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Uncropped 1200px rendition of each upload, used for newsletter pictures.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_email_url" varchar;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_email_width" numeric;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_email_height" numeric;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_email_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_email_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_email_filename" varchar;
  CREATE INDEX IF NOT EXISTS "media_sizes_email_sizes_email_filename_idx" ON "media" USING btree ("sizes_email_filename");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP INDEX IF EXISTS "media_sizes_email_sizes_email_filename_idx";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_email_url";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_email_width";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_email_height";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_email_mime_type";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_email_filesize";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_email_filename";
  `)
}
