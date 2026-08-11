import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE IF NOT EXISTS "commissioned_portraits" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"subject" varchar,
  	"year" numeric,
  	"medium" varchar DEFAULT 'Acrylic on canvas',
  	"width_in" numeric,
  	"height_in" numeric,
  	"owner_quote" varchar,
  	"owner_name" varchar,
  	"owner_location" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "commissioned_portraits_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL
  );
  DO $$ BEGIN
    ALTER TABLE "commissioned_portraits_images" ADD CONSTRAINT "commissioned_portraits_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "commissioned_portraits_images" ADD CONSTRAINT "commissioned_portraits_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."commissioned_portraits"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  CREATE INDEX IF NOT EXISTS "commissioned_portraits_images_order_idx" ON "commissioned_portraits_images" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "commissioned_portraits_images_parent_id_idx" ON "commissioned_portraits_images" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "commissioned_portraits_images_image_idx" ON "commissioned_portraits_images" USING btree ("image_id");
  CREATE INDEX IF NOT EXISTS "commissioned_portraits_updated_at_idx" ON "commissioned_portraits" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "commissioned_portraits_created_at_idx" ON "commissioned_portraits" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "commissioned_portraits_id" integer;
  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_commissioned_portraits_fk" FOREIGN KEY ("commissioned_portraits_id") REFERENCES "public"."commissioned_portraits"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_commissioned_portraits_id_idx" ON "payload_locked_documents_rels" USING btree ("commissioned_portraits_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "commissioned_portraits_id";
  DROP TABLE IF EXISTS "commissioned_portraits_images" CASCADE;
  DROP TABLE IF EXISTS "commissioned_portraits" CASCADE;
  `)
}
