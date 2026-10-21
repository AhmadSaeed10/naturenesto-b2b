// Applies db/migrations/*.sql in order. Each file runs in its own transaction and is
// recorded in private.schema_migrations with a checksum, so an applied file can never be
// edited silently: add a new migration instead.
//
//   npm run db:migrate            apply pending migrations
//   npm run db:migrate -- --status  list applied and pending, change nothing
import { connectionString, describeTarget, fail, readMigrations, withClient } from "./lib.ts";

const statusOnly = process.argv.includes("--status");
const LOCK_KEY = 7_340_215; // arbitrary, shared by every migrate run

await withClient(async (client) => {
  console.log(`Target: ${describeTarget(connectionString())}`);

  await client.query("create schema if not exists private");
  await client.query(`
    create table if not exists private.schema_migrations (
      name text primary key,
      checksum text not null,
      applied_at timestamptz not null default now()
    )`);

  // Two runs at once (CI and a laptop) must not interleave.
  await client.query("select pg_advisory_lock($1)", [LOCK_KEY]);
  try {
    const applied = new Map<string, string>(
      (
        await client.query<{ name: string; checksum: string }>(
          "select name, checksum from private.schema_migrations",
        )
      ).rows.map((row) => [row.name, row.checksum]),
    );

    const files = readMigrations();
    for (const [name] of applied) {
      if (!files.some((file) => file.name === name)) {
        fail(`The database has ${name}, which is not in db/migrations. Wrong branch or database?`);
      }
    }

    let pending = 0;
    for (const file of files) {
      const recorded = applied.get(file.name);
      if (recorded !== undefined) {
        if (recorded !== file.checksum) {
          fail(`${file.name} was edited after it was applied. Revert it and add a new migration.`);
        }
        console.log(`  applied  ${file.name}`);
        continue;
      }
      pending += 1;
      if (statusOnly) {
        console.log(`  pending  ${file.name}`);
        continue;
      }
      try {
        await client.query("begin");
        await client.query(file.sql);
        await client.query(
          "insert into private.schema_migrations (name, checksum) values ($1, $2)",
          [file.name, file.checksum],
        );
        await client.query("commit");
        console.log(`  applied  ${file.name} (new)`);
      } catch (error) {
        await client.query("rollback");
        const message = error instanceof Error ? error.message : String(error);
        fail(`${file.name} failed and was rolled back:\n${message}`);
      }
    }
    console.log(
      pending === 0 ? "Up to date." : statusOnly ? `${pending} pending.` : `Applied ${pending}.`,
    );
  } finally {
    await client.query("select pg_advisory_unlock($1)", [LOCK_KEY]);
  }
});
