"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { SORT_ORDERS } from "@/lib/admin/collections-shared";
import { cleanSearch } from "@/lib/admin/media";
import { ACCESS, staffWithRole } from "@/lib/auth/staff";
import { HANDLE_PATTERN, toTag } from "@/lib/handle";
import { and, asc, eq, ilike, isNull, notInArray, or, sql } from "drizzle-orm";
import { db, withActor } from "@/lib/db";
import { categories, collectionProducts, collections, products } from "@/lib/db/schema";

export type CollectionResult =
  | { ok: true; id: string }
  | {
      ok: false;
      error: "invalid" | "handleTaken" | "rules" | "forbidden" | "failed";
      fields?: string[];
    };

const ruleSchema = z.object({
  field: z.enum(["tag", "product_type", "vendor"]),
  value: z.string().trim().min(1).max(100),
});

const collectionSchema = z
  .object({
    id: z.uuid().nullable(),
    title: z.string().trim().min(1).max(120),
    handle: z.string().trim().max(100).regex(HANDLE_PATTERN),
    description: z.string().trim().max(2000),
    kind: z.enum(["manual", "automatic"]),
    rules: z.array(ruleSchema).max(10),
    sortOrder: z.enum(SORT_ORDERS),
    published: z.boolean(),
    imageId: z.union([z.literal(""), z.uuid()]),
    seoTitle: z.string().trim().max(70),
    seoDescription: z.string().trim().max(170),
    productIds: z.array(z.uuid()).max(1000),
  })
  // Tags are compared exactly, so tag rules use the same normalised form as product tags.
  .transform((value) => ({
    ...value,
    rules: value.rules.map((rule) =>
      rule.field === "tag" ? { ...rule, value: toTag(rule.value) } : rule,
    ),
  }));

export type CollectionInput = z.input<typeof collectionSchema>;

function refresh(id?: string) {
  revalidateTag("products", "max");
  revalidatePath("/admin/collections");
  if (id) revalidatePath(`/admin/collections/${id}`);
}

export async function saveCollection(input: CollectionInput): Promise<CollectionResult> {
  const actor = await staffWithRole(ACCESS.catalog);
  if (!actor) return { ok: false, error: "forbidden" };
  const parsed = collectionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid",
      fields: [...new Set(parsed.error.issues.map((i) => String(i.path[0])))],
    };
  }
  const value = parsed.data;
  if (value.kind === "automatic" && value.rules.length === 0) return { ok: false, error: "rules" };

  const row = {
    title: value.title,
    handle: value.handle,
    description: value.description || null,
    kind: value.kind,
    rules: value.kind === "automatic" ? value.rules : [],
    sortOrder: value.sortOrder,
    status: value.published ? ("published" as const) : ("draft" as const),
    imageId: value.imageId || null,
    seoTitle: value.seoTitle || null,
    seoDescription: value.seoDescription || null,
  };

  let id: string;
  try {
    id = await withActor(actor.id, async (tx) => {
      const [saved] = value.id
        ? await tx
            .update(collections)
            .set(row)
            .where(eq(collections.id, value.id))
            .returning({ id: collections.id })
        : await tx.insert(collections).values(row).returning({ id: collections.id });
      if (!saved) throw new Error("collection not found");
      if (value.kind === "manual") {
        // Membership is small and order matters, so it is rewritten: drop removed products,
        // then upsert the rest with their new positions.
        await tx
          .delete(collectionProducts)
          .where(
            value.productIds.length
              ? and(
                  eq(collectionProducts.collectionId, saved.id),
                  notInArray(collectionProducts.productId, value.productIds),
                )
              : eq(collectionProducts.collectionId, saved.id),
          );
        if (value.productIds.length) {
          await tx
            .insert(collectionProducts)
            .values(
              value.productIds.map((productId, position) => ({
                collectionId: saved.id,
                productId,
                position,
              })),
            )
            .onConflictDoUpdate({
              target: [collectionProducts.collectionId, collectionProducts.productId],
              set: { position: sql`excluded.position` },
            });
        }
      }
      return saved.id;
    });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") return { ok: false, error: "handleTaken" };
    console.error("[collections] save failed", error instanceof Error ? error.message : error);
    return { ok: false, error: "failed" };
  }

  refresh(id);
  return { ok: true, id };
}

export async function deleteCollection(id: string): Promise<{ ok: boolean }> {
  const actor = await staffWithRole(ACCESS.catalog);
  if (!actor) return { ok: false };
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return { ok: false };
  try {
    await withActor(actor.id, (tx) =>
      tx.delete(collections).where(eq(collections.id, parsed.data)),
    );
  } catch {
    return { ok: false };
  }
  refresh();
  return { ok: true };
}

export interface ProductHit {
  id: string;
  title: string;
  handle: string;
}

/** Product search for pickers (collections today, discounts later). */
export async function searchProducts(query: string): Promise<ProductHit[]> {
  if (!(await staffWithRole(ACCESS.catalog))) return [];
  const term = cleanSearch(query);
  if (!term) return [];
  return db()
    .select({ id: products.id, title: products.title, handle: products.handle })
    .from(products)
    .where(
      and(
        isNull(products.deletedAt),
        or(ilike(products.title, `%${term}%`), ilike(products.handle, `%${term}%`)),
      ),
    )
    .orderBy(asc(products.title))
    .limit(20);
}

// Categories ------------------------------------------------------------------------------

export interface CategoryState {
  status: "idle" | "saved" | "invalid" | "handleTaken" | "cycle" | "forbidden" | "failed";
}

const categorySchema = z.object({
  id: z.union([z.literal(""), z.uuid()]),
  name: z.string().trim().min(1).max(80),
  handle: z.string().trim().max(100).regex(HANDLE_PATTERN),
  parentId: z.union([z.literal(""), z.uuid()]),
});

export async function saveCategory(
  _previous: CategoryState,
  formData: FormData,
): Promise<CategoryState> {
  const actor = await staffWithRole(ACCESS.catalog);
  if (!actor) return { status: "forbidden" };
  const parsed = categorySchema.safeParse({
    id: formData.get("id") ?? "",
    name: formData.get("name"),
    handle: formData.get("handle"),
    parentId: formData.get("parentId") ?? "",
  });
  if (!parsed.success) return { status: "invalid" };
  const { id, name, handle, parentId } = parsed.data;

  if (id && parentId) {
    // Walk up from the new parent; meeting this category means the move would loop.
    const all = await db()
      .select({ id: categories.id, parentId: categories.parentId })
      .from(categories);
    const parents = new Map(all.map((row) => [row.id, row.parentId]));
    let cursor: string | null | undefined = parentId;
    for (let guard = 0; cursor && guard < 100; guard += 1) {
      if (cursor === id) return { status: "cycle" };
      cursor = parents.get(cursor);
    }
  }

  const row = { name, handle, parentId: parentId || null };
  try {
    await withActor(actor.id, (tx) =>
      id
        ? tx.update(categories).set(row).where(eq(categories.id, id))
        : tx.insert(categories).values(row),
    );
  } catch (error) {
    return { status: (error as { code?: string }).code === "23505" ? "handleTaken" : "failed" };
  }
  revalidatePath("/admin/collections/categories");
  return { status: "saved" };
}

export async function deleteCategory(id: string): Promise<{ ok: boolean }> {
  const actor = await staffWithRole(ACCESS.catalog);
  if (!actor) return { ok: false };
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return { ok: false };
  try {
    await withActor(actor.id, (tx) => tx.delete(categories).where(eq(categories.id, parsed.data)));
  } catch {
    return { ok: false };
  }
  revalidatePath("/admin/collections/categories");
  return { ok: true };
}
