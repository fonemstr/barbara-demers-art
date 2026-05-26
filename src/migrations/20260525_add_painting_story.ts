import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "paintings" ADD COLUMN IF NOT EXISTS "story_behind_painting" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "paintings" DROP COLUMN IF EXISTS "story_behind_painting";
  `)
}
