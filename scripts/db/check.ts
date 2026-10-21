// Confirms the connection strings work and shows what the database looks like.
// Prints host and database only, never credentials.
import { Pool } from "@neondatabase/serverless";
import pg from "pg";
import { describeTarget, fail } from "./lib.ts";

async function probe(label: string, url: string | undefined): Promise<void> {
  if (!url) {
    console.log(`${label}: not set`);
    return;
  }
  const client = new pg.Client({ connectionString: url });
  const started = Date.now();
  try {
    await client.connect();
    const { rows } = await client.query<{ version: string; migrated: boolean }>(
      `select split_part(version(), ' ', 2) as version,
              to_regclass('private.schema_migrations') is not null as migrated`,
    );
    const row = rows[0];
    const applied = row?.migrated
      ? (await client.query<{ count: string }>("select count(*) from private.schema_migrations"))
          .rows[0]?.count
      : "0 (not migrated yet)";
    console.log(
      `${label}: ok  ${describeTarget(url)}  postgres ${row?.version}  ${Date.now() - started} ms  migrations=${applied}`,
    );
  } catch (error) {
    console.log(
      `${label}: FAILED  ${describeTarget(url)}  ${error instanceof Error ? error.message : error}`,
    );
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => undefined);
  }
}

const pooled = process.env.DATABASE_URL;
const direct = process.env.DATABASE_URL_UNPOOLED;
if (!pooled && !direct)
  fail("Set DATABASE_URL and DATABASE_URL_UNPOOLED in .env.local. See docs/NEON.md.");

await probe("DATABASE_URL (pooled, used by the app)", pooled);
await probe("DATABASE_URL_UNPOOLED (direct, used by migrations)", direct);
if (pooled && !pooled.includes("-pooler")) {
  console.log("Note: DATABASE_URL has no -pooler in its host. Use the pooled string for the app.");
}
if (direct?.includes("-pooler")) {
  console.log(
    "Note: DATABASE_URL_UNPOOLED has -pooler in its host. Migrations need the direct string.",
  );
}

// The app talks to Neon through the serverless driver, not pg, so exercise that path too.
// It needs Neon's websocket endpoint, so it is skipped for local databases.
if (pooled?.includes("neon.tech")) {
  const pool = new Pool({ connectionString: pooled });
  try {
    const { rows } = await pool.query<{ ok: number }>("select 1 as ok");
    console.log(
      `App driver (@neondatabase/serverless over DATABASE_URL): ${rows[0]?.ok === 1 ? "ok" : "unexpected result"}`,
    );
  } catch (error) {
    console.log(
      `App driver (@neondatabase/serverless over DATABASE_URL): FAILED  ${error instanceof Error ? error.message : error}`,
    );
    process.exitCode = 1;
  } finally {
    await pool.end().catch(() => undefined);
  }
}
