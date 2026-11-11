import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { staffInvites } from "@/lib/db/schema";

/** An invite link works once and stops working after this long. */
export const INVITE_TTL_MS = 24 * 60 * 60 * 1000;

/** A fresh random token for the link, plus the hash that is stored (the token itself never is). */
export function newInviteToken(): { token: string; hash: string; expiresAt: Date } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token), expiresAt: new Date(Date.now() + INVITE_TTL_MS) };
}

export const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

export function inviteUrl(token: string): string {
  const origin =
    process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return new URL(`/admin/invite/${token}`, origin).toString();
}

/** Looks up a live invite (not accepted, not expired) by the raw token from the link. */
export async function findLiveInvite(token: string) {
  const [invite] = await db()
    .select()
    .from(staffInvites)
    .where(
      and(
        eq(staffInvites.tokenHash, hashToken(token)),
        isNull(staffInvites.acceptedAt),
        sql`${staffInvites.expiresAt} > now()`,
      ),
    )
    .limit(1);
  return invite ?? null;
}
