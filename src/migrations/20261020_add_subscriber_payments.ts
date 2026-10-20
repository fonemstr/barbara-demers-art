import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// The latest payment on each Budderlee Post subscriber, and the mailing it
// pays for. Filled by the invoice.paid webhook and the daily payments cron.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "subscribers" ADD COLUMN IF NOT EXISTS "paid_for_mailing" timestamp(3) with time zone;
  ALTER TABLE "subscribers" ADD COLUMN IF NOT EXISTS "last_payment_at" timestamp(3) with time zone;
  ALTER TABLE "subscribers" ADD COLUMN IF NOT EXISTS "last_payment_amount" numeric;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "subscribers" DROP COLUMN IF EXISTS "paid_for_mailing";
  ALTER TABLE "subscribers" DROP COLUMN IF EXISTS "last_payment_at";
  ALTER TABLE "subscribers" DROP COLUMN IF EXISTS "last_payment_amount";
  `)
}
