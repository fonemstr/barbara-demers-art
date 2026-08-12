import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// The village series was renamed Meadowbrook -> Budderlee on Aug 9; the
// enum value kept the old name until deploys could self-migrate. Renaming
// the value updates every existing row automatically.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
    IF EXISTS (
      SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'enum_paintings_collection' AND e.enumlabel = 'meadowbrook'
    ) THEN
      ALTER TYPE "public"."enum_paintings_collection" RENAME VALUE 'meadowbrook' TO 'budderlee';
    END IF;
  END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
    IF EXISTS (
      SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'enum_paintings_collection' AND e.enumlabel = 'budderlee'
    ) THEN
      ALTER TYPE "public"."enum_paintings_collection" RENAME VALUE 'budderlee' TO 'meadowbrook';
    END IF;
  END $$;
  `)
}
