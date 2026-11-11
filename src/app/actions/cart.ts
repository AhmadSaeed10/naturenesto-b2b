"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { RATE_LIMITS, clientIp, withinRateLimit } from "@/lib/rate-limit";
import {
  commerceEnabled,
  ensureCart,
  quoteCart,
  readCartToken,
  restorePreviousCart,
  startBuyNowCart,
} from "@/lib/commerce/cart";
import { storedImageUrl } from "@/lib/media";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { cartItems, carts, products, productVariants } from "@/lib/db/schema";

export type CartResult =
  | { ok: true; count: number }
  | { ok: false; error: "invalid" | "unavailable" | "rateLimited" | "failed" };

const MAX_QUANTITY = 99;
const variantSchema = z.uuid();
const quantitySchema = z.number().int().min(0).max(MAX_QUANTITY);

/** Units the cart may hold for a variant: unlimited (99) unless stock is tracked. */
async function sellable(variantId: string): Promise<number | null> {
  const [data] = await db()
    .select({
      stock: productVariants.stock,
      trackInventory: productVariants.trackInventory,
      allowBackorder: productVariants.allowBackorder,
      status: products.status,
      deletedAt: products.deletedAt,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(eq(productVariants.id, variantId))
    .limit(1);
  if (!data || data.status !== "active" || data.deletedAt) return null;
  return data.trackInventory && !data.allowBackorder
    ? Math.min(MAX_QUANTITY, data.stock)
    : MAX_QUANTITY;
}

async function count(cartId: string): Promise<number> {
  const [row] = await db()
    .select({ n: sql<number>`coalesce(sum(${cartItems.quantity}), 0)::int` })
    .from(cartItems)
    .where(eq(cartItems.cartId, cartId));
  return row?.n ?? 0;
}

async function guard(): Promise<CartResult | null> {
  if (!commerceEnabled()) return { ok: false, error: "failed" };
  if (!(await withinRateLimit(RATE_LIMITS.cart, await clientIp())))
    return { ok: false, error: "rateLimited" };
  return null;
}

export async function addToCart(variantId: string, quantity: number): Promise<CartResult> {
  const blocked = await guard();
  if (blocked) return blocked;
  const variant = variantSchema.safeParse(variantId);
  const qty = quantitySchema.safeParse(quantity);
  if (!variant.success || !qty.success || qty.data === 0) return { ok: false, error: "invalid" };

  const limit = await sellable(variant.data);
  if (limit === null || limit === 0) return { ok: false, error: "unavailable" };

  try {
    const cartId = await ensureCart();
    // One statement adds to an existing line or creates it, so two clicks cannot race.
    await db()
      .insert(cartItems)
      .values({ cartId, variantId: variant.data, quantity: Math.min(limit, qty.data) })
      .onConflictDoUpdate({
        target: [cartItems.cartId, cartItems.variantId],
        set: { quantity: sql`least(${limit}, ${cartItems.quantity} + ${qty.data})` },
      });
    revalidatePath("/cart");
    return { ok: true, count: await count(cartId) };
  } catch (error) {
    console.error("[cart] add failed", error instanceof Error ? error.message : error);
    return { ok: false, error: "failed" };
  }
}

/** Sets a line's quantity; 0 removes it. */
export async function setCartQuantity(variantId: string, quantity: number): Promise<CartResult> {
  const blocked = await guard();
  if (blocked) return blocked;
  const variant = variantSchema.safeParse(variantId);
  const qty = quantitySchema.safeParse(quantity);
  const token = await readCartToken();
  if (!variant.success || !qty.success || !token) return { ok: false, error: "invalid" };

  try {
    const [cart] = await db()
      .select({ id: carts.id })
      .from(carts)
      .where(and(eq(carts.token, token), eq(carts.status, "open")))
      .limit(1);
    if (!cart) return { ok: false, error: "invalid" };

    if (qty.data === 0) {
      await db()
        .delete(cartItems)
        .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.variantId, variant.data)));
    } else {
      const limit = (await sellable(variant.data)) ?? 0;
      await db()
        .update(cartItems)
        .set({ quantity: Math.max(1, Math.min(limit || qty.data, qty.data)) })
        .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.variantId, variant.data)));
    }
    revalidatePath("/cart");
    revalidatePath("/checkout");
    return { ok: true, count: await count(cart.id) };
  } catch (error) {
    console.error("[cart] update failed", error instanceof Error ? error.message : error);
    return { ok: false, error: "failed" };
  }
}

export interface DrawerCart {
  count: number;
  subtotal: number;
  blocked: boolean;
  lines: {
    variantId: string;
    handle: string;
    title: string;
    variantTitle: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    max: number;
    available: boolean;
    image: string | null;
  }[];
}

/** The cart as the slide-in drawer shows it. */
export async function readCart(): Promise<DrawerCart> {
  const empty: DrawerCart = { count: 0, subtotal: 0, blocked: false, lines: [] };
  if (!commerceEnabled()) return empty;
  const quote = await quoteCart();
  if (!quote) return empty;
  return {
    count: quote.lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotal: quote.subtotal,
    blocked: quote.unavailable.length > 0,
    lines: quote.lines.map((line) => ({
      variantId: line.variantId,
      handle: line.handle,
      title: line.title,
      variantTitle: line.variantTitle,
      unitPrice: line.unitPrice,
      quantity: line.quantity,
      lineTotal: line.lineTotal,
      max:
        line.trackInventory && !line.allowBackorder
          ? Math.min(MAX_QUANTITY, line.stock)
          : MAX_QUANTITY,
      available: line.available,
      image: storedImageUrl(line.image),
    })),
  };
}

/** Checks out one item on its own cart; the shopper's usual cart waits in the background. */
export async function buyNow(variantId: string, quantity: number): Promise<CartResult> {
  const blocked = await guard();
  if (blocked) return blocked;
  const variant = variantSchema.safeParse(variantId);
  const qty = quantitySchema.safeParse(quantity);
  if (!variant.success || !qty.success || qty.data === 0) return { ok: false, error: "invalid" };
  const limit = await sellable(variant.data);
  if (limit === null || limit === 0) return { ok: false, error: "unavailable" };
  try {
    const cartId = await startBuyNowCart();
    await db()
      .insert(cartItems)
      .values({ cartId, variantId: variant.data, quantity: Math.min(limit, qty.data) });
    return { ok: true, count: await count(cartId) };
  } catch (error) {
    console.error("[cart] buy now failed", error instanceof Error ? error.message : error);
    return { ok: false, error: "failed" };
  }
}

/** Leaves a buy now checkout and goes back to the usual cart. */
export async function backToCart(): Promise<void> {
  await restorePreviousCart();
  redirect("/cart");
}
