// Shared helpers for the database scripts (migrate, seed, check, smoke).
// Run through npm so .env.local is loaded: `npm run db:migrate`.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const migrationsDir = resolve(root, "db/migrations");

export function fail(message: string): never {
  console.error(`\n${message}\n`);
  process.exit(1);
}

/**
 * Scripts use the direct (unpooled) connection: migrations take an advisory lock and run
 * multi statement files, which a transaction pooler does not support.
 */
export function connectionString(): string {
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!url) {
    fail(
      "No database URL. Set DATABASE_URL_UNPOOLED (and DATABASE_URL) in .env.local.\n" +
        "See docs/NEON.md.",
    );
  }
  return url;
}

/** host/database, never the user or password. */
export function describeTarget(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return "(unparseable connection string)";
  }
}

export function isLocal(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false;
  }
}

export async function withClient<T>(fn: (client: pg.Client) => Promise<T>): Promise<T> {
  const client = new pg.Client({ connectionString: connectionString() });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export interface MigrationFile {
  name: string;
  sql: string;
  checksum: string;
}

export function readMigrations(): MigrationFile[] {
  return readdirSync(migrationsDir)
    .filter((file) => /^\d{4}_.+\.sql$/.test(file))
    .sort()
    .map((name) => {
      const sql = readFileSync(resolve(migrationsDir, name), "utf8");
      return { name, sql, checksum: createHash("sha256").update(sql).digest("hex") };
    });
}
