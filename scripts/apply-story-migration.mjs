import pg from "pg";

const connectionString =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

if (!connectionString) {
  throw new Error(
    "No production Postgres connection string found. Expected POSTGRES_URL, DATABASE_URL, POSTGRES_PRISMA_URL, or POSTGRES_URL_NON_POOLING."
  );
}

const client = new pg.Client({
  connectionString,
  ssl: connectionString.includes("sslmode=disable")
    ? false
    : { rejectUnauthorized: false },
});

const migrationName = "20260525_add_painting_story";

await client.connect();

try {
  await client.query("BEGIN");

  await client.query(`
    ALTER TABLE "paintings"
    ADD COLUMN IF NOT EXISTS "story_behind_painting" varchar;
  `);

  const migrationsTable = await client.query(`
    SELECT to_regclass('public.payload_migrations') AS table_name;
  `);

  if (migrationsTable.rows[0]?.table_name) {
    const existing = await client.query(
      `SELECT id FROM "payload_migrations" WHERE name = $1 LIMIT 1;`,
      [migrationName]
    );

    if (existing.rowCount === 0) {
      const batchResult = await client.query(`
        SELECT COALESCE(MAX(batch), 0) + 1 AS next_batch
        FROM "payload_migrations"
        WHERE batch > 0;
      `);

      await client.query(
        `INSERT INTO "payload_migrations" (name, batch) VALUES ($1, $2);`,
        [migrationName, batchResult.rows[0]?.next_batch ?? 1]
      );
    }
  }

  await client.query("COMMIT");
  console.log(`Applied ${migrationName}`);
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
