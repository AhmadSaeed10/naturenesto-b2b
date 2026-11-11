import "server-only";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import { normalizeDatabaseUrl } from "./url";

// One pool per server instance, using the pooled Neon string (host contains "-pooler").
// Migrations and scripts use DATABASE_URL_UNPOOLED instead (scripts/db).

function createDb(pool: pg.Pool) {
  return drizzle({ client: pool, schema });
}

export type Database = ReturnType<typeof createDb>;
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
/** Either the database or a transaction: what a query helper needs to run a statement. */
export type Executor = Database | Transaction;

// Kept on globalThis so dev server reloads do not open a new pool each time.
const globalForDb = globalThis as unknown as {
  __naturenestoPool?: pg.Pool;
  __naturenestoDb?: Database;
};

/** True when the app can reach a database. Without it the storefront shows sample content. */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getPool(): pg.Pool {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. See docs/NEON.md.");
  }
  if (!globalForDb.__naturenestoPool) {
    const pool = new pg.Pool({
      connectionString: normalizeDatabaseUrl(url),
      // Small on purpose: every serverless instance has its own pool behind Neon's pooler.
      max: 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 15_000,
    });
    // An idle client can be dropped by the server; that must not crash the process.
    pool.on("error", (error) => console.error("[db] idle client error", error.message));
    globalForDb.__naturenestoPool = pool;
  }
  return globalForDb.__naturenestoPool;
}

export function db(): Database {
  globalForDb.__naturenestoDb ??= createDb(getPool());
  return globalForDb.__naturenestoDb;
}

/**
 * Runs `fn` in a transaction on behalf of a user. The id is stored in the transaction local
 * setting `app.user_id`, which the audit log, the role guard and `adjust_stock` read, so every
 * write is attributed to the real actor. Pass null for trusted server work (checkout, rate
 * limits, seeding). Check the user's role before calling: the database no longer does.
 */
export async function withActor<T>(
  userId: string | null,
  fn: (tx: Transaction) => Promise<T>,
): Promise<T> {
  return db().transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.user_id', ${userId ?? ""}, true)`);
    return fn(tx);
  });
}
