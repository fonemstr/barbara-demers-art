import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Marks which of a painting's photos show it staged in a themed scene, so
// the site can caption them. Existing photos start unmarked.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "paintings_images" ADD COLUMN IF NOT EXISTS "themed_scene" boolean DEFAULT false;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "paintings_images" DROP COLUMN IF EXISTS "themed_scene";
  `)
}
