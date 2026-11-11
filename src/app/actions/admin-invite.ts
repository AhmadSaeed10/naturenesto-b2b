"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { findLiveInvite } from "@/lib/auth/invites";
import { ADMIN_HOME } from "@/lib/auth/paths";
import { getAuth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { authUser, profiles, staffInvites } from "@/lib/db/schema";
import { RATE_LIMITS, clientIp, withinRateLimit } from "@/lib/rate-limit";

export interface InviteState {
  status: "idle" | "name" | "short" | "mismatch" | "expired" | "failed";
}

const schema = z.object({
  token: z.string().min(20).max(100),
  name: z.string().trim().min(1).max(80),
  password: z.string().min(10).max(128),
  confirm: z.string(),
});

/**
 * The invite page form: creates the login with the chosen name and password, grants the
 * invited access, burns the link and signs the person in.
 */
export async function acceptInvite(
  _previous: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const ip = await clientIp();
  if (!(await withinRateLimit(RATE_LIMITS.login, ip))) return { status: "failed" };

  const parsed = schema.safeParse({
    token: formData.get("token"),
    name: formData.get("name"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return { status: field === "password" ? "short" : field === "name" ? "name" : "expired" };
  }
  const { token, name, password, confirm } = parsed.data;
  if (password !== confirm) return { status: "mismatch" };

  const invite = await findLiveInvite(token);
  if (!invite) return { status: "expired" };
  const email = invite.email.toLowerCase();

  try {
    const context = await getAuth().$context;
    const hash = await context.password.hash(password);

    let [user] = await db()
      .select({ id: authUser.id })
      .from(authUser)
      .where(eq(authUser.email, email))
      .limit(1);
    if (!user) {
      // The new user trigger gives the profile its role and permissions from this invite.
      const created = await context.internalAdapter.createUser(
        { email, emailVerified: true, name },
        { method: "admin" },
      );
      user = { id: created.id };
    }

    // Burn the link first so a second click cannot reuse it, then make sure the profile matches.
    await db().transaction(async (tx) => {
      await tx
        .update(staffInvites)
        .set({ acceptedAt: new Date(), tokenHash: null })
        .where(eq(staffInvites.id, invite.id));
      await tx
        .update(profiles)
        .set({ role: invite.role, permissions: invite.permissions, fullName: name })
        .where(eq(profiles.id, user.id));
      await tx.update(authUser).set({ name }).where(eq(authUser.id, user.id));
    });

    const accounts = await context.internalAdapter.findAccounts(user.id);
    if (accounts.some((account) => account.providerId === "credential")) {
      await context.internalAdapter.updatePassword(user.id, hash);
    } else {
      await context.internalAdapter.linkAccount({
        userId: user.id,
        providerId: "credential",
        accountId: user.id,
        password: hash,
      });
    }

    await getAuth().api.signInEmail({ body: { email, password }, headers: await headers() });
  } catch (error) {
    console.error("[invite] accept failed", error instanceof Error ? error.message : error);
    return { status: "failed" };
  }
  redirect(ADMIN_HOME);
}
