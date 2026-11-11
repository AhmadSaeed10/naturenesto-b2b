import { type SQL, and, eq, isNull, lte, or, sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

// The rules the old row level security policies applied to public reads. Without RLS every
// storefront query must include them, and staff queries must not.

/** Published, and not scheduled for later: pages, blog posts and workshops. */
export function publishedNow(status: AnyPgColumn, publishedAt: AnyPgColumn): SQL {
  return and(
    eq(status, sql`'published'`),
    or(isNull(publishedAt), lte(publishedAt, sql`now()`)),
  ) as SQL;
}
