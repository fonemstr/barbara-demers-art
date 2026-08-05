import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE "paintings_print_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"width_in" numeric NOT NULL,
  	"height_in" numeric NOT NULL,
  	"price_cents" numeric NOT NULL
  );
  ALTER TABLE "paintings_print_options" ADD CONSTRAINT "paintings_print_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."paintings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "paintings_print_options_order_idx" ON "paintings_print_options" USING btree ("_order");
  CREATE INDEX "paintings_print_options_parent_id_idx" ON "paintings_print_options" USING btree ("_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE "paintings_print_options" CASCADE;
  `)
}
