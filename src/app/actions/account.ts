"use server";

import { and, count, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ensureCustomerAccount } from "@/lib/auth/accounts";
import { ACCOUNT_HOME, ACCOUNT_LOGIN } from "@/lib/auth/paths";
import { getAuth, isAuthConfigured } from "@/lib/auth/server";
import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { addresses, customers } from "@/lib/db/schema";
import { RATE_LIMITS, clientIp, withinRateLimit } from "@/lib/rate-limit";

export interface LinkState {
  status: "idle" | "sent" | "email" | "rateLimited" | "notConfigured";
}

/**
 * Emails a customer sign in link. The login is created here, so public sign up stays closed
 * in Better Auth. Same answer whether or not the email already has an account.
 */
export async function requestAccountLink(
  _previous: LinkState,
  formData: FormData,
): Promise<LinkState> {
  if (!isAuthConfigured()) return { status: "notConfigured" };
  const email = z
    .email()
    .max(320)
    .transform((v) => v.trim().toLowerCase())
    .safeParse(formData.get("email"));
  if (!email.success) return { status: "email" };

  const [ipOk, emailOk] = await Promise.all([
    withinRateLimit(RATE_LIMITS.account, await clientIp()),
    withinRateLimit(RATE_LIMITS.account, email.data),
  ]);
  if (!ipOk || !emailOk) return { status: "rateLimited" };

  if (!(await ensureCustomerAccount(email.data))) return { status: "sent" };
  try {
    await getAuth().api.signInMagicLink({
      body: {
        email: email.data,
        callbackURL: ACCOUNT_HOME,
        errorCallbackURL: `${ACCOUNT_LOGIN}?error=callback`,
      },
      headers: await headers(),
    });
  } catch (error) {
    console.error("[account] link failed", error instanceof Error ? error.message : error);
  }
  return { status: "sent" };
}

export async function signOutCustomer(): Promise<void> {
  if (isAuthConfigured()) {
    await getAuth()
      .api.signOut({ headers: await headers() })
      .catch(() => undefined);
  }
  redirect("/");
}

// Addresses: every query below is limited to the signed in customer's own rows in code.

export interface AddressState {
  status: "idle" | "saved" | "invalid" | "failed";
  fields?: string[];
}

const addressSchema = z.object({
  fullName: z.string().trim().min(2).max(200),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s()-]{7,20}$/),
  line1: z.string().trim().min(3).max(300),
  line2: z.string().trim().max(300),
  area: z.string().trim().max(200),
  city: z.string().trim().min(2).max(120),
  province: z.string().trim().max(120),
  postalCode: z.string().trim().max(20),
});

async function myCustomerId(): Promise<string | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const [row] = await db()
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.userId, user.id))
    .limit(1);
  return row?.id ?? null;
}

export async function saveAddress(
  _previous: AddressState,
  formData: FormData,
): Promise<AddressState> {
  const parsed = addressSchema.safeParse(
    Object.fromEntries(
      Object.keys(addressSchema.shape).map((k) => [k, String(formData.get(k) ?? "")]),
    ),
  );
  if (!parsed.success)
    return {
      status: "invalid",
      fields: [...new Set(parsed.error.issues.map((i) => String(i.path[0])))],
    };
  const customerId = await myCustomerId();
  if (!customerId) return { status: "failed" };
  const v = parsed.data;
  try {
    await db().transaction(async (tx) => {
      const [existing] = await tx
        .select({ n: count() })
        .from(addresses)
        .where(eq(addresses.customerId, customerId));
      await tx.insert(addresses).values({
        customerId,
        fullName: v.fullName,
        phone: v.phone,
        line1: v.line1,
        line2: v.line2 || null,
        area: v.area || null,
        city: v.city,
        province: v.province || null,
        postalCode: v.postalCode || null,
        // The first address becomes the default.
        isDefault: (existing?.n ?? 0) === 0,
      });
    });
  } catch (error) {
    console.error("[account] save address failed", error instanceof Error ? error.message : error);
    return { status: "failed" };
  }
  revalidatePath(ACCOUNT_HOME);
  return { status: "saved" };
}

export async function removeAddress(id: string): Promise<void> {
  if (!z.uuid().safeParse(id).success) return;
  const customerId = await myCustomerId();
  if (!customerId) return;
  await db()
    .delete(addresses)
    .where(and(eq(addresses.id, id), eq(addresses.customerId, customerId)));
  revalidatePath(ACCOUNT_HOME);
}

export async function makeDefaultAddress(id: string): Promise<void> {
  if (!z.uuid().safeParse(id).success) return;
  const customerId = await myCustomerId();
  if (!customerId) return;
  await db().transaction(async (tx) => {
    const [own] = await tx
      .select({ id: addresses.id })
      .from(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.customerId, customerId)))
      .limit(1);
    if (!own) return;
    await tx
      .update(addresses)
      .set({ isDefault: false })
      .where(eq(addresses.customerId, customerId));
    await tx.update(addresses).set({ isDefault: true }).where(eq(addresses.id, id));
  });
  revalidatePath(ACCOUNT_HOME);
}
