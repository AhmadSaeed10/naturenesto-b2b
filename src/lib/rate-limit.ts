import "server-only";
import { headers } from "next/headers";
import { sql } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/lib/db";

export interface RateLimitRule {
  /** Short name of the action, for example "login". */
  scope: string;
  limit: number;
  windowSeconds: number;
}

export const RATE_LIMITS = {
  login: { scope: "login", limit: 10, windowSeconds: 15 * 60 },
  loginEmail: { scope: "login-email", limit: 5, windowSeconds: 15 * 60 },
  cart: { scope: "cart", limit: 120, windowSeconds: 10 * 60 },
  checkout: { scope: "checkout", limit: 10, windowSeconds: 15 * 60 },
  account: { scope: "account", limit: 5, windowSeconds: 15 * 60 },
} as const satisfies Record<string, RateLimitRule>;

/** Best effort client address. Vercel sets x-forwarded-for; the first entry is the client. */
export async function clientIp(): Promise<string> {
  const list = await headers();
  return list.get("x-forwarded-for")?.split(",")[0]?.trim() || list.get("x-real-ip") || "unknown";
}

/**
 * Counts one hit and reports whether the caller is still within the limit. Fails closed:
 * if the database cannot be reached the action is refused rather than left unprotected.
 */
export async function withinRateLimit(rule: RateLimitRule, subject: string): Promise<boolean> {
  if (!isDatabaseConfigured()) {
    console.error("[rate-limit] no database configured");
    return false;
  }
  try {
    const result = await db().execute<{ ok: boolean }>(
      sql`select public.hit_rate_limit(${`${rule.scope}:${subject}`}, ${rule.limit}, ${rule.windowSeconds}) as ok`,
    );
    return result.rows[0]?.ok === true;
  } catch (error) {
    console.error("[rate-limit] check failed", error instanceof Error ? error.message : error);
    return false;
  }
}
