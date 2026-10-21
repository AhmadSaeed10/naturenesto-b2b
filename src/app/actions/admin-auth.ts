"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { z } from "zod";
import { ensureStaffAccount } from "@/lib/auth/accounts";
import { ADMIN_LOGIN, safeAdminNext } from "@/lib/auth/paths";
import { getAuth, isAuthConfigured } from "@/lib/auth/server";
import { loadStaff } from "@/lib/auth/staff";
import { RATE_LIMITS, clientIp, withinRateLimit } from "@/lib/rate-limit";

export type LoginError = "email" | "credentials" | "rateLimited" | "notConfigured" | "notStaff";

export interface LoginState {
  status: "idle" | "error" | "link_sent";
  error?: LoginError;
  email?: string;
}

const loginSchema = z.object({
  email: z
    .email()
    .max(320)
    .transform((value) => value.trim().toLowerCase()),
  password: z.string().max(200).optional(),
  next: z.string().max(500).optional(),
});

export async function signIn(_previous: LoginState, formData: FormData): Promise<LoginState> {
  if (!isAuthConfigured()) return { status: "error", error: "notConfigured" };

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password") || undefined,
    next: formData.get("next") || undefined,
  });
  if (!parsed.success) return { status: "error", error: "email" };
  const { email, password, next } = parsed.data;

  const ip = await clientIp();
  const [ipOk, emailOk] = await Promise.all([
    withinRateLimit(RATE_LIMITS.login, ip),
    withinRateLimit(RATE_LIMITS.loginEmail, email),
  ]);
  if (!ipOk || !emailOk) return { status: "error", error: "rateLimited", email };

  const auth = getAuth();

  if (password) {
    let signedIn;
    try {
      signedIn = await auth.api.signInEmail({
        body: { email, password },
        headers: await headers(),
      });
    } catch (error) {
      if (!(error instanceof APIError)) throw error;
      return { status: "error", error: "credentials", email };
    }
    // The session cookie set by signInEmail is not readable from this request yet, so the
    // staff check goes by the user id the sign in returned.
    if (!(await loadStaff(signedIn.user.id))) {
      // A customer account must not keep a session from the admin form.
      const context = await auth.$context;
      await context.internalAdapter.deleteSession(signedIn.token).catch(() => undefined);
      (await cookies()).delete(context.authCookies.sessionToken.name);
      return { status: "error", error: "notStaff", email };
    }
    redirect(safeAdminNext(next));
  }

  // Same answer whether or not the email has access, so the form cannot be used to find out
  // who the staff are.
  if (await ensureStaffAccount(email)) {
    try {
      await auth.api.signInMagicLink({
        body: {
          email,
          callbackURL: safeAdminNext(next),
          errorCallbackURL: `${ADMIN_LOGIN}?error=callback`,
        },
        headers: await headers(),
      });
    } catch (error) {
      console.error(
        "[admin-auth] magic link failed",
        error instanceof Error ? error.message : error,
      );
    }
  }
  return { status: "link_sent", email };
}

export async function signOut(): Promise<void> {
  if (isAuthConfigured()) {
    await getAuth()
      .api.signOut({ headers: await headers() })
      .catch(() => undefined);
  }
  redirect(ADMIN_LOGIN);
}
