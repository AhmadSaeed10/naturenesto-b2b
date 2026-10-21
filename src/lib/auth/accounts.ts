import "server-only";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { authUser, profiles, staffInvites } from "@/lib/db/schema";
import { getAuth } from "./server";

/** Creates the login for an email. The database trigger gives it a profile (and a staff role if invited). */
async function createLogin(email: string): Promise<boolean> {
  const existing = await db()
    .select({ id: authUser.id })
    .from(authUser)
    .where(eq(authUser.email, email))
    .limit(1);
  if (existing.length > 0) return true;
  try {
    const context = await getAuth().$context;
    await context.internalAdapter.createUser(
      { email, emailVerified: true, name: email.split("@")[0] ?? email },
      { method: "admin" },
    );
    return true;
  } catch (error) {
    // Two sign in requests can race: the second one finds the user the first created.
    const again = await db()
      .select({ id: authUser.id })
      .from(authUser)
      .where(eq(authUser.email, email))
      .limit(1);
    if (again.length > 0) return true;
    console.error("[auth] could not create login", error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Staff-only access: an email can sign in only if it has a pending invite or a profile with a
 * role. The login is created here on first sign in, so public sign ups stay closed.
 */
export async function ensureStaffAccount(email: string): Promise<boolean> {
  const [invite] = await db()
    .select()
    .from(staffInvites)
    .where(sql`lower(${staffInvites.email}) = ${email}`)
    .limit(1);
  const [profile] = await db()
    .select({ id: profiles.id, role: profiles.role })
    .from(profiles)
    .where(sql`lower(${profiles.email}) = ${email}`)
    .limit(1);

  if (profile?.role) return true;
  if (!invite) return false;
  // An accepted invite whose profile has no role means access was removed; it must not come
  // back by signing in again.
  if (profile && invite.acceptedAt) return false;

  if (profile) {
    // An existing non staff login (a customer) invited later: the invite trigger only runs when
    // a login is created, so the role is applied here.
    await db().transaction(async (tx) => {
      await tx.update(profiles).set({ role: invite.role }).where(eq(profiles.id, profile.id));
      await tx
        .update(staffInvites)
        .set({ acceptedAt: new Date() })
        .where(and(eq(staffInvites.id, invite.id), isNull(staffInvites.acceptedAt)));
    });
    return true;
  }
  return createLogin(email);
}

/** Customers may sign in with any email. Same answer whether or not the account existed. */
export const ensureCustomerAccount = createLogin;
