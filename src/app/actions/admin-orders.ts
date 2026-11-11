"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { ACCESS, staffWithRole } from "@/lib/auth/staff";
import { withActor } from "@/lib/db";
import { ENUMS } from "@/lib/db/enums";
import { fulfillments, orderItems, orders, orderStatusHistory, payments } from "@/lib/db/schema";

export interface OrderActionState {
  status: "idle" | "done" | "forbidden" | "invalid" | "state" | "failed";
}

const number = z.coerce.number().int().positive();
const note = z.string().trim().max(300);

// A delivered or cancelled order is closed. Everything else may move to any open status.
const CLOSED = ["delivered", "cancelled"];

class StateError extends Error {}

async function run(
  numberInput: unknown,
  work: (
    tx: Parameters<Parameters<typeof withActor>[1]>[0],
    order: typeof orders.$inferSelect,
  ) => Promise<void>,
  actorId: string,
): Promise<OrderActionState> {
  const parsed = number.safeParse(numberInput);
  if (!parsed.success) return { status: "invalid" };
  try {
    await withActor(actorId, async (tx) => {
      // Lock the row so two staff cannot cancel (and restock) the same order twice.
      const result = await tx.execute<{ id: string }>(
        sql`select id from public.orders where number = ${parsed.data} for update`,
      );
      const id = result.rows[0]?.id;
      if (!id) throw new StateError("missing");
      const [order] = await tx.select().from(orders).where(eq(orders.id, id)).limit(1);
      if (!order) throw new StateError("missing");
      await work(tx, order);
    });
  } catch (error) {
    if (error instanceof StateError) return { status: "state" };
    console.error("[orders] update failed", error instanceof Error ? error.message : error);
    return { status: "failed" };
  }
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${parsed.data}`);
  revalidatePath("/admin");
  return { status: "done" };
}

export async function updateOrderStatus(
  _previous: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  const actor = await staffWithRole(ACCESS.orders);
  if (!actor) return { status: "forbidden" };
  const parsed = z
    .object({ status: z.enum(ENUMS.order_status), note })
    .safeParse({ status: formData.get("status"), note: formData.get("note") ?? "" });
  if (!parsed.success) return { status: "invalid" };
  const { status, note: text } = parsed.data;

  return run(
    formData.get("number"),
    async (tx, order) => {
      if (CLOSED.includes(order.status) || order.status === status) throw new StateError("closed");
      await tx
        .update(orders)
        .set({ status, cancelledAt: status === "cancelled" ? new Date() : null })
        .where(eq(orders.id, order.id));
      if (status === "cancelled") await restock(tx, order);
      await tx.insert(orderStatusHistory).values({ orderId: order.id, status, note: text || null });
    },
    actor.id,
  );
}

/** Puts a cancelled order's items back on the shelf, logged against the order. */
async function restock(
  tx: Parameters<Parameters<typeof withActor>[1]>[0],
  order: typeof orders.$inferSelect,
): Promise<void> {
  const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  for (const item of items) {
    if (!item.variantId) continue;
    // Only variants that track stock were decremented at checkout.
    const result = await tx.execute<{ t: boolean }>(
      sql`select track_inventory as t from public.product_variants where id = ${item.variantId}::uuid`,
    );
    if (!result.rows[0]?.t) continue;
    await tx.execute(
      sql`select public.adjust_stock(${item.variantId}::uuid, ${item.quantity}, 'returned'::public.stock_reason, ${`Order #${order.number} cancelled`})`,
    );
  }
}

export async function setOrderPayment(
  _previous: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  const actor = await staffWithRole(ACCESS.orders);
  if (!actor) return { status: "forbidden" };
  const paid = formData.get("paid") === "true";
  return run(
    formData.get("number"),
    async (tx, order) => {
      if (order.status === "cancelled") throw new StateError("cancelled");
      await tx
        .update(orders)
        .set({ paymentStatus: paid ? "paid" : "unpaid" })
        .where(eq(orders.id, order.id));
      await tx
        .update(payments)
        .set({ status: paid ? "paid" : "pending" })
        .where(and(eq(payments.orderId, order.id), eq(payments.provider, order.paymentMethod)));
      await tx.insert(orderStatusHistory).values({
        orderId: order.id,
        status: order.status,
        note: paid ? "Marked as paid" : "Marked as unpaid",
      });
    },
    actor.id,
  );
}

export async function addShipment(
  _previous: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  const actor = await staffWithRole(ACCESS.orders);
  if (!actor) return { status: "forbidden" };
  const parsed = z
    .object({
      carrier: z.string().trim().max(80),
      trackingNumber: z.string().trim().max(120),
      trackingUrl: z
        .string()
        .trim()
        .max(500)
        .refine((value) => value === "" || /^https:\/\//.test(value)),
    })
    .safeParse({
      carrier: formData.get("carrier") ?? "",
      trackingNumber: formData.get("trackingNumber") ?? "",
      trackingUrl: formData.get("trackingUrl") ?? "",
    });
  if (!parsed.success) return { status: "invalid" };
  const v = parsed.data;
  return run(
    formData.get("number"),
    async (tx, order) => {
      if (CLOSED.includes(order.status)) throw new StateError("closed");
      await tx.insert(fulfillments).values({
        orderId: order.id,
        carrier: v.carrier || null,
        trackingNumber: v.trackingNumber || null,
        trackingUrl: v.trackingUrl || null,
        shippedAt: new Date(),
      });
      await tx
        .update(orders)
        .set({ status: "shipped", fulfillmentStatus: "fulfilled" })
        .where(eq(orders.id, order.id));
      await tx.insert(orderStatusHistory).values({
        orderId: order.id,
        status: "shipped",
        note: [v.carrier, v.trackingNumber].filter(Boolean).join(" ") || null,
      });
    },
    actor.id,
  );
}
