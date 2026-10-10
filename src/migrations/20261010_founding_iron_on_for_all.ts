import { MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// The Founding Member iron-on now goes to anyone who subscribes by the end
// of October 15 (studio time), not only waitlist members. Flag anyone who
// already subscribed inside that window without being on the waitlist.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  UPDATE "subscribers"
  SET "founding_member" = true
  WHERE "founding_member" IS NOT TRUE
    AND COALESCE("started_at", "created_at") < '2026-10-16T04:00:00Z';
  `)
}

// Which rows were flagged here isn't recorded, so there is nothing to undo.
export async function down(): Promise<void> {}
