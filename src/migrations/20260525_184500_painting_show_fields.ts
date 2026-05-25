import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_paintings_images_role" AS ENUM('main', 'detail', 'scale', 'signature');
    CREATE TYPE "public"."enum_paintings_availability_status" AS ENUM('available', 'reserved', 'sold', 'comingSoon', 'inStudio');
    CREATE TYPE "public"."enum_paintings_price_display" AS ENUM('visible', 'inquire', 'hidden');

    ALTER TABLE "paintings_images"
      ADD COLUMN "role" "enum_paintings_images_role" DEFAULT 'detail',
      ADD COLUMN "caption" varchar;

    ALTER TABLE "paintings"
      ADD COLUMN "story_teaser" varchar,
      ADD COLUMN "story" varchar,
      ADD COLUMN "availability_status" "enum_paintings_availability_status" DEFAULT 'available' NOT NULL,
      ADD COLUMN "price_display" "enum_paintings_price_display" DEFAULT 'visible' NOT NULL,
      ADD COLUMN "availability_note" varchar;

    UPDATE "paintings"
      SET "availability_status" = 'sold'
      WHERE "sold" = true;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "paintings_images"
      DROP COLUMN "role",
      DROP COLUMN "caption";

    ALTER TABLE "paintings"
      DROP COLUMN "story_teaser",
      DROP COLUMN "story",
      DROP COLUMN "availability_status",
      DROP COLUMN "price_display",
      DROP COLUMN "availability_note";

    DROP TYPE "public"."enum_paintings_images_role";
    DROP TYPE "public"."enum_paintings_availability_status";
    DROP TYPE "public"."enum_paintings_price_display";
  `)
}
