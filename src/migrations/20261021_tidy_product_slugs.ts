import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Product slugs saved before the Products collection cleaned them up: one
// ended in a space (its page was a 404) and one had a capital letter.
// Same rule as toSlug() in src/collections/Products.ts.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  UPDATE "products"
  SET "slug" = trim(both '-' from regexp_replace(lower(trim("slug")), '[^a-z0-9]+', '-', 'g'))
  WHERE "slug" <> trim(both '-' from regexp_replace(lower(trim("slug")), '[^a-z0-9]+', '-', 'g'));
  `)
}

export async function down({}: MigrateDownArgs): Promise<void> {
  // The old slugs were broken; there is nothing to restore.
}
