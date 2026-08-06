import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
    CREATE TYPE "public"."enum_social_posts_status" AS ENUM('draft', 'send', 'scheduled', 'posted', 'failed');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_social_posts_platforms" AS ENUM('instagram', 'facebook', 'twitter', 'pinterest');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  CREATE TABLE IF NOT EXISTS "social_posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"message" varchar NOT NULL,
  	"image_id" integer,
  	"schedule_at" timestamp(3) with time zone,
  	"status" "enum_social_posts_status" DEFAULT 'draft' NOT NULL,
  	"result" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "social_posts_platforms" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_social_posts_platforms",
  	"id" serial PRIMARY KEY NOT NULL
  );
  DO $$ BEGIN
    ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "social_posts_platforms" ADD CONSTRAINT "social_posts_platforms_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."social_posts"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  CREATE INDEX IF NOT EXISTS "social_posts_image_idx" ON "social_posts" USING btree ("image_id");
  CREATE INDEX IF NOT EXISTS "social_posts_updated_at_idx" ON "social_posts" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "social_posts_created_at_idx" ON "social_posts" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "social_posts_platforms_order_idx" ON "social_posts_platforms" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "social_posts_platforms_parent_idx" ON "social_posts_platforms" USING btree ("parent_id");
  ALTER TABLE "paintings" ADD COLUMN IF NOT EXISTS "announce_on_social" boolean DEFAULT false;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "social_posts_id" integer;
  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_social_posts_fk" FOREIGN KEY ("social_posts_id") REFERENCES "public"."social_posts"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_social_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("social_posts_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "social_posts_id";
  ALTER TABLE "paintings" DROP COLUMN IF EXISTS "announce_on_social";
  DROP TABLE IF EXISTS "social_posts_platforms" CASCADE;
  DROP TABLE IF EXISTS "social_posts" CASCADE;
  DROP TYPE IF EXISTS "public"."enum_social_posts_platforms";
  DROP TYPE IF EXISTS "public"."enum_social_posts_status";
  `)
}
