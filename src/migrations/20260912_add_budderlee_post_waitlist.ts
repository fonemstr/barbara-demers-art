import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// The Budderlee Post, phase one: the settings global and the waitlist.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
    CREATE TYPE "public"."enum_budderlee_post_phase" AS ENUM('waitlist', 'open', 'closed');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;

  CREATE TABLE IF NOT EXISTS "waitlist" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"name" varchar,
  	"source" varchar,
  	"joined_at" timestamp(3) with time zone,
  	"invited_at" timestamp(3) with time zone,
  	"subscribed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS "waitlist_email_idx" ON "waitlist" USING btree ("email");
  CREATE INDEX IF NOT EXISTS "waitlist_updated_at_idx" ON "waitlist" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "waitlist_created_at_idx" ON "waitlist" USING btree ("created_at");

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "waitlist_id" integer;
  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_waitlist_fk" FOREIGN KEY ("waitlist_id") REFERENCES "public"."waitlist"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_waitlist_id_idx" ON "payload_locked_documents_rels" USING btree ("waitlist_id");

  CREATE TABLE IF NOT EXISTS "budderlee_post" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"phase" "enum_budderlee_post_phase" DEFAULT 'waitlist' NOT NULL,
  	"next_mailing" varchar DEFAULT 'November 2026',
  	"first_resident_id" integer,
  	"subscriber_cap" numeric DEFAULT 100,
  	"cutoff_day" numeric DEFAULT 15,
  	"price_cents" numeric DEFAULT 1200,
  	"founding_window_ends" timestamp(3) with time zone DEFAULT '2026-10-15T00:00:00.000Z',
  	"stripe_price_id" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  DO $$ BEGIN
    ALTER TABLE "budderlee_post" ADD CONSTRAINT "budderlee_post_first_resident_id_paintings_id_fk" FOREIGN KEY ("first_resident_id") REFERENCES "public"."paintings"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  CREATE INDEX IF NOT EXISTS "budderlee_post_first_resident_idx" ON "budderlee_post" USING btree ("first_resident_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP TABLE IF EXISTS "budderlee_post" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "waitlist_id";
  DROP TABLE IF EXISTS "waitlist" CASCADE;
  DROP TYPE IF EXISTS "public"."enum_budderlee_post_phase";
  `)
}
