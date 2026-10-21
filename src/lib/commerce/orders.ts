import "server-only";
import { z } from "zod";
import { storedImageUrl } from "@/lib/media";
import { and, asc, eq, type SQL } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth/session";
import { getStaff } from "@/lib/auth/staff";
import { db } from "@/lib/db";
import type { Enums } from "@/lib/db/enums";
import { customers, fulfillments, orderItems, orders, orderStatusHistory } from "@/lib/db/schema";

export interface OrderView {
  number: number;
  status: Enums<"order_status">;
  paymentStatus: Enums<"payment_status">;
  paymentMethod: string;
  placedAt: string;
  fullName: string;
  email: string;
  phone: string;
  address: Record<string, string>;
  notes: string | null;
  subtotal: number;
  discountTotal: number;
  discountCode: string | null;
  shippingTotal: number;
  taxTotal: number;
  total: number;
  items: {
    title: string;
    variantTitle: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    image: string | null;
  }[];
  history: { status: string; note: string | null; at: string }[];
  fulfillments: {
    carrier: string | null;
    trackingNumber: string | null;
    trackingUrl: string | null;
    shippedAt: string | null;
  }[];
}

type OrderRow = typeof orders.$inferSelect;
type ItemRow = typeof orderItems.$inferSelect;
type HistoryRow = typeof orderStatusHistory.$inferSelect;
type FulfillmentRow = typeof fulfillments.$inferSelect;

function toView(
  row: OrderRow,
  items: ItemRow[],
  history: HistoryRow[],
  shipments: FulfillmentRow[],
): OrderView {
  const address =
    row.shippingAddress &&
    typeof row.shippingAddress === "object" &&
    !Array.isArray(row.shippingAddress)
      ? Object.fromEntries(
          Object.entries(row.shippingAddress).filter(
            (e): e is [string, string] => typeof e[1] === "string",
          ),
        )
      : {};
  return {
    number: Number(row.number),
    status: row.status,
    paymentStatus: row.paymentStatus,
    paymentMethod: row.paymentMethod,
    placedAt: row.placedAt.toISOString(),
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
    address,
    notes: row.notes,
    subtotal: row.subtotal,
    discountTotal: row.discountTotal,
    discountCode: row.discountCode,
    shippingTotal: row.shippingTotal,
    taxTotal: row.taxTotal,
    total: row.total,
    items: items.map((item) => ({
      title: item.title,
      variantTitle: item.variantTitle,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      image: storedImageUrl(item.imageUrl),
    })),
    history: history.map((h) => ({
      status: h.status,
      note: h.note,
      at: h.createdAt.toISOString(),
    })),
    fulfillments: shipments.map((f) => ({
      carrier: f.carrier,
      trackingNumber: f.trackingNumber,
      trackingUrl: f.trackingUrl,
      shippedAt: f.shippedAt?.toISOString() ?? null,
    })),
  };
}

async function load(where: SQL | undefined): Promise<OrderView | null> {
  const [row] = await db().select().from(orders).where(where).limit(1);
  if (!row) return null;
  const [items, history, shipments] = await Promise.all([
    db()
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, row.id))
      .orderBy(asc(orderItems.createdAt)),
    db()
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, row.id))
      .orderBy(asc(orderStatusHistory.createdAt)),
    db().select().from(fulfillments).where(eq(fulfillments.orderId, row.id)),
  ]);
  return toView(row, items, history, shipments);
}

/**
 * An order by number, for its page. A guest needs the secret token from their link; a signed
 * in customer can open their own orders, and order staff can open any (checked here, in code).
 */
export async function getOrder(number: number, token: string | null): Promise<OrderView | null> {
  if (token && z.uuid().safeParse(token).success) {
    const byToken = await load(and(eq(orders.number, number), eq(orders.accessToken, token)));
    if (byToken) return byToken;
  }
  const staff = await getStaff();
  if (staff && ["owner", "admin", "support"].includes(staff.role)) {
    return load(eq(orders.number, number));
  }
  const user = await getSessionUser();
  if (!user) return null;
  const [mine] = await db()
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.userId, user.id))
    .limit(1);
  if (!mine) return null;
  return load(and(eq(orders.number, number), eq(orders.customerId, mine.id)));
}
