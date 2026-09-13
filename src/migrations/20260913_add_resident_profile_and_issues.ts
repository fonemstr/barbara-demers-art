import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// The Budderlee Post, phase two: the resident profile on Budderlee
// paintings (what prints on the back of the card) and the Issues
// collection (one per mailing month).
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
    CREATE TYPE "public"."enum_paintings_profile_star_sign" AS ENUM('aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_issues_status" AS ENUM('planning', 'printer', 'ready', 'shipped');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;

  ALTER TABLE "paintings" ADD COLUMN IF NOT EXISTS "profile_resident_number" numeric;
  ALTER TABLE "paintings" ADD COLUMN IF NOT EXISTS "profile_date_of_birth" timestamp(3) with time zone;
  ALTER TABLE "paintings" ADD COLUMN IF NOT EXISTS "profile_star_sign" "enum_paintings_profile_star_sign";

  CREATE TABLE IF NOT EXISTS "paintings_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"paintings_id" integer
  );
  DO $$ BEGIN
    ALTER TABLE "paintings_rels" ADD CONSTRAINT "paintings_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."paintings"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "paintings_rels" ADD CONSTRAINT "paintings_rels_paintings_fk" FOREIGN KEY ("paintings_id") REFERENCES "public"."paintings"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  CREATE INDEX IF NOT EXISTS "paintings_rels_order_idx" ON "paintings_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "paintings_rels_parent_idx" ON "paintings_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "paintings_rels_path_idx" ON "paintings_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "paintings_rels_paintings_id_idx" ON "paintings_rels" USING btree ("paintings_id");

  CREATE TABLE IF NOT EXISTS "issues" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"mailing_month" timestamp(3) with time zone NOT NULL,
  	"resident_id" integer NOT NULL,
  	"status" "enum_issues_status" DEFAULT 'planning' NOT NULL,
  	"story_title" varchar,
  	"story" jsonb,
  	"recipe_title" varchar,
  	"recipe" jsonb,
  	"sticker_note" varchar,
  	"notes" varchar,
  	"shipping_list_generated_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  DO $$ BEGIN
    ALTER TABLE "issues" ADD CONSTRAINT "issues_resident_id_paintings_id_fk" FOREIGN KEY ("resident_id") REFERENCES "public"."paintings"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  CREATE UNIQUE INDEX IF NOT EXISTS "issues_mailing_month_idx" ON "issues" USING btree ("mailing_month");
  CREATE INDEX IF NOT EXISTS "issues_resident_idx" ON "issues" USING btree ("resident_id");
  CREATE INDEX IF NOT EXISTS "issues_updated_at_idx" ON "issues" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "issues_created_at_idx" ON "issues" USING btree ("created_at");

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "issues_id" integer;
  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_issues_fk" FOREIGN KEY ("issues_id") REFERENCES "public"."issues"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_issues_id_idx" ON "payload_locked_documents_rels" USING btree ("issues_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "issues_id";
  DROP TABLE IF EXISTS "issues" CASCADE;
  DROP TABLE IF EXISTS "paintings_rels" CASCADE;
  ALTER TABLE "paintings" DROP COLUMN IF EXISTS "profile_resident_number";
  ALTER TABLE "paintings" DROP COLUMN IF EXISTS "profile_date_of_birth";
  ALTER TABLE "paintings" DROP COLUMN IF EXISTS "profile_star_sign";
  DROP TYPE IF EXISTS "public"."enum_issues_status";
  DROP TYPE IF EXISTS "public"."enum_paintings_profile_star_sign";
  `)
}
