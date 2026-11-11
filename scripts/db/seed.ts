// Applies db/seed.sql (generated from src/content by `npm run seed:generate`). The seed is
// idempotent, so running it twice is safe. Staff invites are never part of it.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { connectionString, describeTarget, fail, root, withClient } from "./lib.ts";

await withClient(async (client) => {
  console.log(`Target: ${describeTarget(connectionString())}`);
  const sql = readFileSync(resolve(root, "db/seed.sql"), "utf8");
  try {
    await client.query("begin");
    await client.query(sql);
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    fail(
      `Seed failed and was rolled back:\n${error instanceof Error ? error.message : String(error)}`,
    );
  }
  const { rows } = await client.query<{ products: string; sections: string }>(
    "select (select count(*) from public.products) as products, (select count(*) from public.page_sections) as sections",
  );
  console.log(`Seeded. products=${rows[0]?.products} page_sections=${rows[0]?.sections}`);
});
