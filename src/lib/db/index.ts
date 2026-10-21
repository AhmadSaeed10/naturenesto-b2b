import "server-only";
import { Pool } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";

// Neon connection for server code. DATABASE_URL is the pooled string (host contains
// "-pooler"). Migrations and scripts use DATABASE_URL_UNPOOLED instead (scripts/db).
//
// The typed schema arrives with the data layer phase (`drizzle-kit pull`); until then this
// exposes the connection and the transaction helper the rest of the backend builds on.

function createDb(connectionString: string) {
  return drizzle({ client: new Pool({ connectionString }) });
}

type Database = ReturnType<typeof createDb>;
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

let instance: Database | undefined;

/** True when the app can reach a database. Without it the storefront shows sample content. */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function db(): Database {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. See docs/NEON.md.");
  }
  instance ??= createDb(url);
  return instance;
}

/**
 * Runs `fn` in a transaction on behalf of a user. The id is stored in the transaction local
 * setting `app.user_id`, which the audit log, the role guard and `adjust_stock` read, so
 * every write is attributed to the real actor. Pass null for trusted server work (checkout,
 * rate limits, seeding). Check the user's role before calling: the database no longer does.
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
