import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// The Budderlee Post, fulfillment phase: the Shipments collection and
// the past-due switch on the settings.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
    CREATE TYPE "public"."enum_shipments_status" AS ENUM('pending', 'shipped', 'skipped');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;

  CREATE TABLE IF NOT EXISTS "shipments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"issue_id" integer,
  	"subscriber_id" integer,
  	"status" "enum_shipments_status" DEFAULT 'pending' NOT NULL,
  	"tracking_number" varchar,
  	"shipped_at" timestamp(3) with time zone,
  	"first_package" boolean DEFAULT false,
  	"include_founding_sticker" boolean DEFAULT false,
  	"email" varchar,
  	"address_snapshot_name" varchar,
  	"address_snapshot_line1" varchar,
  	"address_snapshot_line2" varchar,
  	"address_snapshot_city" varchar,
  	"address_snapshot_state" varchar,
  	"address_snapshot_postal_code" varchar,
  	"address_snapshot_country" varchar,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  DO $$ BEGIN
    ALTER TABLE "shipments" ADD CONSTRAINT "shipments_issue_id_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "shipments" ADD CONSTRAINT "shipments_subscriber_id_subscribers_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."subscribers"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  CREATE INDEX IF NOT EXISTS "shipments_issue_idx" ON "shipments" USING btree ("issue_id");
  CREATE INDEX IF NOT EXISTS "shipments_subscriber_idx" ON "shipments" USING btree ("subscriber_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "shipments_issue_subscriber_idx" ON "shipments" USING btree ("issue_id", "subscriber_id");
  CREATE INDEX IF NOT EXISTS "shipments_updated_at_idx" ON "shipments" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "shipments_created_at_idx" ON "shipments" USING btree ("created_at");

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "shipments_id" integer;
  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_shipments_fk" FOREIGN KEY ("shipments_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_shipments_id_idx" ON "payload_locked_documents_rels" USING btree ("shipments_id");

  ALTER TABLE "budderlee_post" ADD COLUMN IF NOT EXISTS "include_past_due" boolean DEFAULT true;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "budderlee_post" DROP COLUMN IF EXISTS "include_past_due";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "shipments_id";
  DROP TABLE IF EXISTS "shipments" CASCADE;
  DROP TYPE IF EXISTS "public"."enum_shipments_status";
  `)
}
