import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// The Budderlee Post, checkout phase: the Subscribers collection (kept
// in step with Stripe by the webhook) and the Stripe Tax switch.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
    CREATE TYPE "public"."enum_subscribers_status" AS ENUM('active', 'trialing', 'past_due', 'paused', 'canceled', 'incomplete');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;

  CREATE TABLE IF NOT EXISTS "subscribers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"name" varchar,
  	"status" "enum_subscribers_status" DEFAULT 'active' NOT NULL,
  	"founding_member" boolean DEFAULT false,
  	"packages_sent" numeric DEFAULT 0,
  	"current_period_end" timestamp(3) with time zone,
  	"trial_end" timestamp(3) with time zone,
  	"started_at" timestamp(3) with time zone,
  	"shipping_address_name" varchar,
  	"shipping_address_line1" varchar,
  	"shipping_address_line2" varchar,
  	"shipping_address_city" varchar,
  	"shipping_address_state" varchar,
  	"shipping_address_postal_code" varchar,
  	"shipping_address_country" varchar,
  	"canceled_at" timestamp(3) with time zone,
  	"cancel_reason" varchar,
  	"notes" varchar,
  	"stripe_customer_id" varchar,
  	"stripe_subscription_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE INDEX IF NOT EXISTS "subscribers_email_idx" ON "subscribers" USING btree ("email");
  CREATE INDEX IF NOT EXISTS "subscribers_stripe_customer_id_idx" ON "subscribers" USING btree ("stripe_customer_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "subscribers_stripe_subscription_id_idx" ON "subscribers" USING btree ("stripe_subscription_id");
  CREATE INDEX IF NOT EXISTS "subscribers_updated_at_idx" ON "subscribers" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "subscribers_created_at_idx" ON "subscribers" USING btree ("created_at");

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "subscribers_id" integer;
  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_subscribers_fk" FOREIGN KEY ("subscribers_id") REFERENCES "public"."subscribers"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_subscribers_id_idx" ON "payload_locked_documents_rels" USING btree ("subscribers_id");

  ALTER TABLE "budderlee_post" ADD COLUMN IF NOT EXISTS "collect_tax" boolean DEFAULT false;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "budderlee_post" DROP COLUMN IF EXISTS "collect_tax";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "subscribers_id";
  DROP TABLE IF EXISTS "subscribers" CASCADE;
  DROP TYPE IF EXISTS "public"."enum_subscribers_status";
  `)
}
