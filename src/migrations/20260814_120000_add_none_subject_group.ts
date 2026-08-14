import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Collection paintings (e.g. Budderlee residents) don't need a species
// group. Postgres can't remove enum values, so down() is a no-op — the
// extra value is harmless if unused.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TYPE "public"."enum_paintings_subject_group" ADD VALUE IF NOT EXISTS 'none';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Postgres does not support removing enum values; nothing to undo.
  void db;
}
