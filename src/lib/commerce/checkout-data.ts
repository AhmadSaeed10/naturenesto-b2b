import "server-only";
import type { CheckoutDefaults } from "@/components/shop/CheckoutForm";
import { asc, desc, eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth/session";
import { db, isDatabaseConfigured } from "@/lib/db";
import { addresses, customers, paymentMethods } from "@/lib/db/schema";

export async function enabledPaymentMethods(): Promise<
  { code: string; name: string; instructions: string | null }[]
> {
  if (!isDatabaseConfigured()) return [];
  return db()
    .select({
      code: paymentMethods.code,
      name: paymentMethods.name,
      instructions: paymentMethods.instructions,
    })
    .from(paymentMethods)
    .where(eq(paymentMethods.enabled, true))
    .orderBy(asc(paymentMethods.position));
}

const EMPTY: CheckoutDefaults = {
  email: "",
  phone: "",
  fullName: "",
  line1: "",
  line2: "",
  area: "",
  city: "",
  province: "",
  postalCode: "",
};

/** Prefills checkout for a signed in customer from their account and default address. */
export async function checkoutDefaults(): Promise<CheckoutDefaults> {
  if (!isDatabaseConfigured()) return EMPTY;
  const user = await getSessionUser();
  if (!user) return EMPTY;
  const [customer] = await db()
    .select()
    .from(customers)
    .where(eq(customers.userId, user.id))
    .limit(1);
  if (!customer) return { ...EMPTY, email: user.email };
  const [address] = await db()
    .select()
    .from(addresses)
    .where(eq(addresses.customerId, customer.id))
    .orderBy(desc(addresses.isDefault), asc(addresses.createdAt))
    .limit(1);
  return {
    email: customer.email || user.email,
    phone: address?.phone ?? customer.phone ?? "",
    fullName: address?.fullName ?? customer.fullName ?? "",
    line1: address?.line1 ?? "",
    line2: address?.line2 ?? "",
    area: address?.area ?? "",
    city: address?.city ?? "",
    province: address?.province ?? "",
    postalCode: address?.postalCode ?? "",
  };
}
