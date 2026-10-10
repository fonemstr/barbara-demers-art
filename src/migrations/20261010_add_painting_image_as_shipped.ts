import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Marks which of a painting's photos shows it exactly as it ships (the
// others are styled scenes). Existing photos start unmarked.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "paintings_images" ADD COLUMN IF NOT EXISTS "as_shipped" boolean DEFAULT false;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "paintings_images" DROP COLUMN IF EXISTS "as_shipped";
  `)
}
