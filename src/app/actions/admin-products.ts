"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { type ProductInput, productSchema } from "@/lib/admin/product-schema";
import { ACCESS, staffWithRole } from "@/lib/auth/staff";
import { inArray, sql } from "drizzle-orm";
import { withActor } from "@/lib/db";
import { products } from "@/lib/db/schema";

export type SaveProductResult =
  | { ok: true; id: string }
  | {
      ok: false;
      error: "invalid" | "handleTaken" | "skuTaken" | "forbidden" | "failed";
      fields?: string[];
    };

/** Storefront catalogue cache (src/lib/catalog.ts). */
const PRODUCTS_TAG = "products";

function refresh() {
  revalidateTag(PRODUCTS_TAG, "max");
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
}

export async function saveProduct(input: ProductInput): Promise<SaveProductResult> {
  const actor = await staffWithRole(ACCESS.catalog);
  if (!actor) return { ok: false, error: "forbidden" };
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((issue) => String(issue.path[0])))];
    return { ok: false, error: "invalid", fields };
  }
  const { description, ...product } = parsed.data;

  let id: string;
  try {
    // save_product writes the product, variants, options, images and links in one call, and
    // checks the caller's role again from app.user_id.
    id = await withActor(actor.id, async (tx) => {
      const payload = JSON.stringify({
        ...product,
        description: { format: "plain", text: description },
      });
      const result = await tx.execute<{ id: string }>(
        sql`select public.save_product(${payload}::jsonb) as id`,
      );
      return String(result.rows[0]?.id);
    });
  } catch (error) {
    const { code, message } = error as { code?: string; message?: string };
    if (code === "23505") {
      return { ok: false, error: message?.includes("sku") ? "skuTaken" : "handleTaken" };
    }
    if (code === "42501") return { ok: false, error: "forbidden" };
    console.error("[products] save failed", message);
    return { ok: false, error: "failed" };
  }
  refresh();
  revalidatePath(`/admin/products/${id}`);
  return { ok: true, id };
}

export type BulkAction = "active" | "draft" | "archived" | "delete" | "restore";

const bulkSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(200),
  action: z.enum(["active", "draft", "archived", "delete", "restore"]),
});

export type BulkResult =
  { ok: true; count: number } | { ok: false; error: "invalid" | "forbidden" | "failed" };

export async function bulkUpdateProducts(ids: string[], action: BulkAction): Promise<BulkResult> {
  const actor = await staffWithRole(ACCESS.catalog);
  if (!actor) return { ok: false, error: "forbidden" };
  const parsed = bulkSchema.safeParse({ ids, action });
  if (!parsed.success) return { ok: false, error: "invalid" };

  // Deleting is a soft delete: the row stays for order history and can be restored.
  const update =
    parsed.data.action === "delete"
      ? { deletedAt: new Date() }
      : parsed.data.action === "restore"
        ? { deletedAt: null }
        : { status: parsed.data.action };

  try {
    const rows = await withActor(actor.id, (tx) =>
      tx
        .update(products)
        .set(update)
        .where(inArray(products.id, parsed.data.ids))
        .returning({ id: products.id }),
    );
    refresh();
    return { ok: true, count: rows.length };
  } catch (error) {
    console.error("[products] bulk update failed", error instanceof Error ? error.message : error);
    return { ok: false, error: "failed" };
  }
}

export async function duplicateProduct(id: string): Promise<SaveProductResult> {
  const actor = await staffWithRole(ACCESS.catalog);
  if (!actor) return { ok: false, error: "forbidden" };
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return { ok: false, error: "invalid" };
  try {
    const copy = await withActor(actor.id, async (tx) => {
      const result = await tx.execute<{ id: string }>(
        sql`select public.duplicate_product(${parsed.data}::uuid) as id`,
      );
      return String(result.rows[0]?.id);
    });
    refresh();
    return { ok: true, id: copy };
  } catch (error) {
    console.error("[products] duplicate failed", error instanceof Error ? error.message : error);
    return { ok: false, error: "failed" };
  }
}
