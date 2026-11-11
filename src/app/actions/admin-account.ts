"use server";

import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { getAuth } from "@/lib/auth/server";
import { getStaff } from "@/lib/auth/staff";

export interface PasswordState {
  status: "idle" | "done" | "short" | "mismatch" | "forbidden" | "failed";
}

const PASSWORD = z.string().min(10).max(128);

/** Staff can add or change a password next to the magic link. Only the signed in user's own. */
export async function setPassword(
  _previous: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const staff = await getStaff();
  const user = await getSessionUser();
  if (!staff || !user) return { status: "forbidden" };
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (!PASSWORD.safeParse(password).success) return { status: "short" };
  if (password !== confirm) return { status: "mismatch" };

  try {
    const context = await getAuth().$context;
    const hash = await context.password.hash(password);
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
    return { status: "done" };
  } catch (error) {
    console.error(
      "[account] password update failed",
      error instanceof Error ? error.message : error,
    );
    return { status: "failed" };
  }
}
