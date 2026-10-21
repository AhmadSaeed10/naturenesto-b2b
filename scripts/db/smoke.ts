// Behaviour checks for the database layer, run against a migrated and seeded database.
// Everything happens inside one transaction that is rolled back, so no data is kept.
//
//   npm run db:smoke
//
// This replaces the old pgTAP row level security tests: authorisation now lives in server
// code, so what the database still guarantees is tested here (audit actor, role guard,
// rate limits, stock log, product save and the whole checkout path).
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type pg from "pg";
import { connectionString, describeTarget, fail, isLocal, withClient } from "./lib.ts";

const url = connectionString();
if (!isLocal(url) && !process.argv.includes("--allow-remote")) {
  fail(
    `Refusing to run against ${describeTarget(url)}.\n` +
      "The smoke test advances sequences (order numbers) even though it rolls back.\n" +
      "Point DATABASE_URL_UNPOOLED at a local database, or pass --allow-remote.",
  );
}

type Client = pg.Client;
let passed = 0;

async function check(name: string, body: () => Promise<void>): Promise<void> {
  try {
    await body();
    passed += 1;
    console.log(`  ok   ${name}`);
  } catch (error) {
    console.log(`  FAIL ${name}`);
    throw error;
  }
}

/** Runs a statement that must fail with the given SQLSTATE, without aborting the transaction. */
async function expectError(
  client: Client,
  code: string,
  sql: string,
  params: unknown[] = [],
): Promise<void> {
  await client.query("savepoint expect_error");
  try {
    await client.query(sql, params);
  } catch (error) {
    await client.query("rollback to savepoint expect_error");
    assert.equal((error as { code?: string }).code, code, `expected SQLSTATE ${code}`);
    return;
  }
  assert.fail(`expected SQLSTATE ${code}, but the statement succeeded`);
}

const actAs = (client: Client, userId: string | null) =>
  client.query("select set_config('app.user_id', $1, true)", [userId ?? ""]);

async function run(client: Client): Promise<void> {
  const owner = randomUUID();
  const editor = randomUUID();
  const admin = randomUUID();

  await check("schema: every migration is applied and the core tables exist", async () => {
    const { rows } = await client.query<{ n: string }>(
      `select count(*)::text as n from information_schema.tables
        where table_schema = 'public' and table_name = any ($1)`,
      [
        [
          "profiles",
          "staff_invites",
          "audit_log",
          "rate_limits",
          "products",
          "product_variants",
          "media_assets",
          "collections",
          "pages",
          "page_sections",
          "page_section_drafts",
          "site_settings",
          "services",
          "consultation_requests",
          "inventory_adjustments",
          "customers",
          "carts",
          "cart_items",
          "orders",
          "order_items",
          "payments",
        ],
      ],
    );
    assert.equal(rows[0]?.n, "21");
  });

  await check("seed: storefront content is present", async () => {
    const { rows } = await client.query<{ settings: string; products: string; sections: string }>(
      `select (select count(*) from public.site_settings)::text as settings,
              (select count(*) from public.products)::text as products,
              (select count(*) from public.page_sections)::text as sections`,
    );
    assert.equal(rows[0]?.settings, "1", "run npm run db:seed first");
    assert.ok(Number(rows[0]?.products) > 0);
    assert.ok(Number(rows[0]?.sections) > 0);
  });

  await check("audit: writes record the acting user and role", async () => {
    await actAs(client, null);
    await client.query(
      "insert into public.profiles (id, email, role) values ($1, 'owner@test.local', 'owner')",
      [owner],
    );
    await actAs(client, owner);
    await client.query("update public.site_settings set store_name = store_name || ' (smoke)'");
    const { rows } = await client.query<{ actor_id: string; actor_role: string }>(
      "select actor_id, actor_role from public.audit_log where table_name = 'site_settings' and actor_id = $1",
      [owner],
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.actor_role, "owner");
  });

  await check("roles: the guard blocks self promotion and admins touching owners", async () => {
    await actAs(client, null); // trusted server maintenance
    await client.query(
      "insert into public.profiles (id, email, role) values ($1, 'editor@test.local', 'editor')",
      [editor],
    );
    await client.query(
      "insert into public.profiles (id, email, role) values ($1, 'admin@test.local', 'admin')",
      [admin],
    );

    await actAs(client, editor);
    await expectError(client, "42501", "update public.profiles set role = 'admin' where id = $1", [
      editor,
    ]);

    await actAs(client, admin);
    await expectError(client, "42501", "update public.profiles set role = 'owner' where id = $1", [
      editor,
    ]);
    await expectError(client, "42501", "update public.profiles set role = 'admin' where id = $1", [
      owner,
    ]);
    await client.query("update public.profiles set role = 'support' where id = $1", [editor]);

    await actAs(client, owner);
    await client.query("update public.profiles set role = 'editor' where id = $1", [editor]);
  });

  await check("rate limit: allows the limit, then refuses", async () => {
    const hit = async () =>
      (await client.query<{ ok: boolean }>("select public.hit_rate_limit('smoke', 2, 60) as ok"))
        .rows[0]?.ok;
    assert.equal(await hit(), true);
    assert.equal(await hit(), true);
    assert.equal(await hit(), false);
  });

  const { rows: variantRows } = await client.query<{
    id: string;
    product_id: string;
    stock: number;
  }>(
    `select id, product_id, stock from public.product_variants
      where track_inventory and not allow_backorder and stock >= 5 limit 1`,
  );
  const variant = variantRows[0];
  assert.ok(variant, "the seed has no tracked variant with stock");

  await check("inventory: adjust_stock changes stock and logs the actor", async () => {
    await actAs(client, owner);
    const { rows } = await client.query<{ stock: number }>(
      "select public.adjust_stock($1, 5, 'received', 'smoke') as stock",
      [variant.id],
    );
    assert.equal(rows[0]?.stock, variant.stock + 5);
    const log = await client.query<{ actor_id: string }>(
      "select actor_id from public.inventory_adjustments where variant_id = $1 and note = 'smoke'",
      [variant.id],
    );
    assert.equal(log.rows[0]?.actor_id, owner);
    await client.query("update public.product_variants set stock = $2 where id = $1", [
      variant.id,
      variant.stock,
    ]);
  });

  await check(
    "catalogue: save_product creates a product with variants, duplicate_product copies it",
    async () => {
      await actAs(client, owner);
      const { rows } = await client.query<{ id: string }>(
        "select public.save_product($1::jsonb) as id",
        [
          JSON.stringify({
            title: "Smoke plant",
            handle: "smoke-plant",
            status: "draft",
            tags: ["smoke"],
            options: [],
            images: [],
            variants: [{ title: "Default", price: 150000, initial_stock: 3 }],
          }),
        ],
      );
      const productId = rows[0]?.id;
      assert.ok(productId);
      const stock = await client.query<{ stock: number }>(
        "select stock from public.product_variants where product_id = $1",
        [productId],
      );
      assert.equal(stock.rows[0]?.stock, 3);
      const copy = await client.query<{ id: string }>("select public.duplicate_product($1) as id", [
        productId,
      ]);
      const copied = await client.query<{ handle: string }>(
        "select handle from public.products where id = $1",
        [copy.rows[0]?.id],
      );
      assert.equal(copied.rows[0]?.handle, "smoke-plant-copy");
    },
  );

  await check("checkout: quote, place order, decrement stock, refuse a second order", async () => {
    await actAs(client, null); // checkout runs as the server, not as staff
    await client.query("update public.products set status = 'active' where id = $1", [
      variant.product_id,
    ]);
    const cart = await client.query<{ id: string; token: string }>(
      "insert into public.carts default values returning id, token",
    );
    const cartRow = cart.rows[0];
    assert.ok(cartRow);
    await client.query(
      "insert into public.cart_items (cart_id, variant_id, quantity) values ($1, $2, 2)",
      [cartRow.id, variant.id],
    );

    const request = {
      cart_token: cartRow.token,
      email: "Buyer@Test.local",
      full_name: "Smoke Buyer",
      phone: "03001234567",
      address: { city: "Lahore", line1: "1 Test Road" },
      payment_method: "cod",
    };

    const quote = await client.query<{ q: { total: number; shipping: number } }>(
      "select public.quote_cart($1::jsonb) as q",
      [JSON.stringify({ cart_token: cartRow.token, city: "Lahore", email: request.email })],
    );
    assert.ok((quote.rows[0]?.q.total ?? 0) > 0);
    assert.equal(quote.rows[0]?.q.shipping, 25000, "Lahore delivery is Rs 250");

    const placed = await client.query<{ o: { number: string; total: number } }>(
      "select public.place_order($1::jsonb) as o",
      [JSON.stringify(request)],
    );
    const order = placed.rows[0]?.o;
    assert.ok(order && Number(order.number) >= 1001);
    assert.equal(order.total, quote.rows[0]?.q.total, "the order total matches the quote");

    const after = await client.query<{ stock: number }>(
      "select stock from public.product_variants where id = $1",
      [variant.id],
    );
    assert.equal(after.rows[0]?.stock, variant.stock - 2);
    const sold = await client.query(
      "select 1 from public.inventory_adjustments where variant_id = $1 and reason = 'sold'",
      [variant.id],
    );
    assert.equal(sold.rowCount, 1);
    const customers = await client.query(
      "select 1 from public.customers where lower(email) = 'buyer@test.local'",
    );
    assert.equal(customers.rowCount, 1);

    await expectError(client, "P0001", "select public.place_order($1::jsonb)", [
      JSON.stringify(request),
    ]);
  });
}

await withClient(async (client) => {
  console.log(`Target: ${describeTarget(url)}`);
  await client.query("begin");
  try {
    await run(client);
    console.log(`\n${passed} checks passed (rolled back, nothing was kept).`);
  } finally {
    await client.query("rollback");
  }
});
