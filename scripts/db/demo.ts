// Makes the seeded demo products live so Add to cart and Buy now show up while you build.
// Run after `npm run db:seed`. It only activates products that are still drafts and only when
// the shop has no active product yet, so it never touches a real catalogue. Add --force to
// override that guard. Hide or archive the demo items from the admin before launch.
import { connectionString, describeTarget, fail, withClient } from "./lib.ts";

const force = process.argv.includes("--force");

await withClient(async (client) => {
  console.log(`Target: ${describeTarget(connectionString())}`);
  const { rows } = await client.query<{ active: string; drafts: string }>(
    `select count(*) filter (where status = 'active') as active,
            count(*) filter (where status = 'draft') as drafts
       from public.products where deleted_at is null`,
  );
  const active = Number(rows[0]?.active ?? 0);
  const drafts = Number(rows[0]?.drafts ?? 0);
  if (drafts === 0) fail("No draft products found. Run `npm run db:seed` first.");
  if (active > 0 && !force) {
    fail(
      `${active} product(s) are already active, so nothing was changed. Use --force to activate the remaining drafts too.`,
    );
  }
  const result = await client.query(
    `update public.products set status = 'active' where status = 'draft' and deleted_at is null`,
  );
  console.log(
    `Activated ${result.rowCount} demo product(s). Restart the dev server to clear its cache.`,
  );
});
