import "server-only";
import { and, count, desc, eq, ilike, inArray, isNull, or, sql, sum } from "drizzle-orm";
import { db } from "@/lib/db";
import type { Enums } from "@/lib/db/enums";
import { customers, orders, productVariants, products } from "@/lib/db/schema";
import { cleanSearch } from "./media";

export const ORDERS_PAGE_SIZE = 20;

export type OrderStatus = Enums<"order_status">;
export type OrderFilter = "all" | OrderStatus;

export interface OrderRow {
  number: number;
  placedAt: string;
  fullName: string;
  email: string;
  phone: string;
  total: number;
  status: OrderStatus;
  paymentStatus: Enums<"payment_status">;
  paymentMethod: string;
}

export interface OrdersPage {
  rows: OrderRow[];
  page: number;
  pageCount: number;
}

const toRow = (row: typeof orders.$inferSelect): OrderRow => ({
  number: Number(row.number),
  placedAt: row.placedAt.toISOString(),
  fullName: row.fullName,
  email: row.email,
  phone: row.phone,
  total: row.total,
  status: row.status,
  paymentStatus: row.paymentStatus,
  paymentMethod: row.paymentMethod,
});

/** Orders, newest first, with an optional status filter and a search over the buyer and number. */
export async function listOrders({
  query,
  filter,
  page,
}: {
  query: string;
  filter: OrderFilter;
  page: number;
}): Promise<OrdersPage> {
  const term = cleanSearch(query);
  const digits = term.replace(/\D/g, "");
  const search = term
    ? or(
        ilike(orders.fullName, `%${term}%`),
        ilike(orders.email, `%${term}%`),
        ilike(orders.phone, `%${term}%`),
        digits ? sql`${orders.number}::text = ${digits.replace(/^#/, "")}` : undefined,
      )
    : undefined;
  const where = and(filter === "all" ? undefined : eq(orders.status, filter), search);

  const [[total], rows] = await Promise.all([
    db().select({ n: count() }).from(orders).where(where),
    db()
      .select()
      .from(orders)
      .where(where)
      .orderBy(desc(orders.placedAt))
      .limit(ORDERS_PAGE_SIZE)
      .offset((page - 1) * ORDERS_PAGE_SIZE),
  ]);
  return {
    rows: rows.map(toRow),
    page,
    pageCount: Math.max(1, Math.ceil((total?.n ?? 0) / ORDERS_PAGE_SIZE)),
  };
}

/** The customer account behind an order, when there is one, for the detail page link. */
export async function customerIdForOrder(number: number): Promise<string | null> {
  const [row] = await db()
    .select({ id: orders.customerId })
    .from(orders)
    .where(eq(orders.number, number))
    .limit(1);
  return row?.id ?? null;
}

export interface CustomerRow {
  id: string;
  fullName: string | null;
  email: string;
  phone: string | null;
  orderCount: number;
  spent: number;
  lastOrderAt: string | null;
}

export const CUSTOMERS_PAGE_SIZE = 30;

export async function listCustomers({
  query,
  page,
}: {
  query: string;
  page: number;
}): Promise<{ rows: CustomerRow[]; page: number; pageCount: number }> {
  const term = cleanSearch(query);
  const where = and(
    isNull(customers.deletedAt),
    term
      ? or(
          ilike(customers.fullName, `%${term}%`),
          ilike(customers.email, `%${term}%`),
          ilike(customers.phone, `%${term}%`),
        )
      : undefined,
  );
  const [[total], rows] = await Promise.all([
    db().select({ n: count() }).from(customers).where(where),
    db()
      .select({
        id: customers.id,
        fullName: customers.fullName,
        email: customers.email,
        phone: customers.phone,
        orderCount: sql<number>`count(${orders.id}) filter (where ${orders.status} <> 'cancelled')::int`,
        spent: sql<number>`coalesce(sum(${orders.total}) filter (where ${orders.status} <> 'cancelled'), 0)::int`,
        lastOrderAt: sql<Date | null>`max(${orders.placedAt})`,
      })
      .from(customers)
      .leftJoin(orders, eq(orders.customerId, customers.id))
      .where(where)
      .groupBy(customers.id)
      .orderBy(sql`max(${orders.placedAt}) desc nulls last`, desc(customers.createdAt))
      .limit(CUSTOMERS_PAGE_SIZE)
      .offset((page - 1) * CUSTOMERS_PAGE_SIZE),
  ]);
  return {
    rows: rows.map((row) => ({
      ...row,
      lastOrderAt: row.lastOrderAt ? new Date(row.lastOrderAt).toISOString() : null,
    })),
    page,
    pageCount: Math.max(1, Math.ceil((total?.n ?? 0) / CUSTOMERS_PAGE_SIZE)),
  };
}

export async function getCustomer(id: string): Promise<{
  customer: { id: string; fullName: string | null; email: string; phone: string | null };
  orders: OrderRow[];
} | null> {
  const [customer] = await db()
    .select({
      id: customers.id,
      fullName: customers.fullName,
      email: customers.email,
      phone: customers.phone,
    })
    .from(customers)
    .where(and(eq(customers.id, id), isNull(customers.deletedAt)))
    .limit(1);
  if (!customer) return null;
  const rows = await db()
    .select()
    .from(orders)
    .where(eq(orders.customerId, id))
    .orderBy(desc(orders.placedAt))
    .limit(100);
  return { customer, orders: rows.map(toRow) };
}

export interface DashboardData {
  today: { orders: number; revenue: number };
  week: { orders: number; revenue: number };
  toAction: number;
  recent: OrderRow[];
  lowStock: { productId: string; title: string; variant: string; stock: number }[];
}

const KARACHI_DAY = sql`(date_trunc('day', now() at time zone 'Asia/Karachi') at time zone 'Asia/Karachi')`;

/** Counts and revenue ignore cancelled orders. */
export async function dashboardData(): Promise<DashboardData> {
  const live = sql`${orders.status} <> 'cancelled'`;
  const [[today], [week], [pending], recent, low] = await Promise.all([
    db()
      .select({ n: count(), revenue: sum(orders.total) })
      .from(orders)
      .where(and(live, sql`${orders.placedAt} >= ${KARACHI_DAY}`)),
    db()
      .select({ n: count(), revenue: sum(orders.total) })
      .from(orders)
      .where(and(live, sql`${orders.placedAt} >= now() - interval '7 days'`)),
    db()
      .select({ n: count() })
      .from(orders)
      .where(inArray(orders.status, ["pending", "confirmed", "processing"])),
    db().select().from(orders).orderBy(desc(orders.placedAt)).limit(6),
    db()
      .select({
        productId: products.id,
        title: products.title,
        variant: productVariants.title,
        stock: productVariants.stock,
        threshold: productVariants.lowStockThreshold,
      })
      .from(productVariants)
      .innerJoin(products, eq(products.id, productVariants.productId))
      .where(
        and(
          eq(productVariants.trackInventory, true),
          isNull(products.deletedAt),
          sql`${productVariants.stock} <= ${productVariants.lowStockThreshold}`,
        ),
      )
      .orderBy(productVariants.stock)
      .limit(6),
  ]);
  return {
    today: { orders: today?.n ?? 0, revenue: Number(today?.revenue ?? 0) },
    week: { orders: week?.n ?? 0, revenue: Number(week?.revenue ?? 0) },
    toAction: pending?.n ?? 0,
    recent: recent.map(toRow),
    lowStock: low.map(({ threshold: _threshold, ...row }) => row),
  };
}
