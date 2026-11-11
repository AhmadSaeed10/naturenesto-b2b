import "server-only";
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { addresses, customers, orders } from "@/lib/db/schema";

export interface AccountView {
  email: string;
  orders: { number: number; total: number; status: string; placedAt: string }[];
  addresses: {
    id: string;
    fullName: string;
    phone: string;
    line1: string;
    line2: string | null;
    area: string | null;
    city: string;
    isDefault: boolean;
  }[];
}

/**
 * The signed in customer's account. On first visit their customer record (from guest
 * checkouts with the same, now verified, email) is linked to the login so past orders show.
 * Everything below is limited to this customer's id: there is no row level security.
 */
export async function getAccount(): Promise<AccountView | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const { id: userId, email } = user;

  const [mine] = await db()
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.userId, userId))
    .limit(1);
  let customerId = mine?.id;

  if (!customerId) {
    const [guest] = await db()
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(
          sql`lower(${customers.email}) = ${email}`,
          isNull(customers.userId),
          isNull(customers.deletedAt),
        ),
      )
      .limit(1);
    const [linked] = guest
      ? await db()
          .update(customers)
          .set({ userId })
          .where(eq(customers.id, guest.id))
          .returning({ id: customers.id })
      : await db()
          .insert(customers)
          .values({ userId, email })
          .onConflictDoNothing()
          .returning({ id: customers.id });
    customerId = linked?.id;
  }
  if (!customerId) return { email, orders: [], addresses: [] };

  const [orderRows, addressRows] = await Promise.all([
    db()
      .select({
        number: orders.number,
        total: orders.total,
        status: orders.status,
        placedAt: orders.placedAt,
      })
      .from(orders)
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.placedAt))
      .limit(50),
    db()
      .select()
      .from(addresses)
      .where(eq(addresses.customerId, customerId))
      .orderBy(desc(addresses.isDefault), asc(addresses.createdAt)),
  ]);
  return {
    email,
    orders: orderRows.map((o) => ({
      number: Number(o.number),
      total: Number(o.total),
      status: o.status,
      placedAt: o.placedAt.toISOString(),
    })),
    addresses: addressRows.map((a) => ({
      id: a.id,
      fullName: a.fullName,
      phone: a.phone,
      line1: a.line1,
      line2: a.line2,
      area: a.area,
      city: a.city,
      isDefault: a.isDefault,
    })),
  };
}
