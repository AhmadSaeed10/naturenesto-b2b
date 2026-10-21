import "server-only";
import { mediaUrl } from "@/lib/media";
import { type SQL, and, asc, eq, isNull, sql } from "drizzle-orm";
import { type Executor, db } from "@/lib/db";
import type { Enums, Json } from "@/lib/db/enums";
import {
  categories,
  collectionProducts,
  collections,
  mediaAssets,
  productImages,
  products,
} from "@/lib/db/schema";
import {
  type CategoryNode,
  type CollectionKind,
  type CollectionMember,
  type EditorCollection,
  SORT_ORDERS,
  type SortOrder,
} from "./collections-shared";
import { type CollectionRule, parseRules } from "./products-shared";

export {
  SORT_ORDERS,
  type CollectionKind,
  type CollectionMember,
  type EditorCollection,
  type SortOrder,
};

export interface CollectionSummary {
  id: string;
  title: string;
  handle: string;
  kind: CollectionKind;
  status: Enums<"content_status">;
  productCount: number;
}

/** Live (not deleted) products matching automatic rules; all rules must match. */
export async function countRuleMatches(
  executor: Executor,
  rules: CollectionRule[],
): Promise<number> {
  if (rules.length === 0) return 0;
  const conditions: SQL[] = [isNull(products.deletedAt)];
  for (const rule of rules) {
    conditions.push(
      rule.field === "tag"
        ? sql`${products.tags} @> ARRAY[${rule.value}]::text[]`
        : eq(rule.field === "vendor" ? products.vendor : products.productType, rule.value),
    );
  }
  const [row] = await executor
    .select({ n: sql<number>`count(*)::int` })
    .from(products)
    .where(and(...conditions));
  return row?.n ?? 0;
}

export async function listCollections(): Promise<CollectionSummary[]> {
  const rows = await db()
    .select({
      id: collections.id,
      title: collections.title,
      handle: collections.handle,
      kind: collections.kind,
      status: collections.status,
      rules: collections.rules,
      manualCount: sql<number>`(select count(*)::int from ${collectionProducts} cp where cp.collection_id = ${collections.id})`,
    })
    .from(collections)
    .orderBy(asc(collections.position), asc(collections.title));
  return Promise.all(
    rows.map(async (row) => {
      const kind: CollectionKind = row.kind === "automatic" ? "automatic" : "manual";
      return {
        id: row.id,
        title: row.title,
        handle: row.handle,
        kind,
        status: row.status,
        productCount:
          kind === "automatic"
            ? await countRuleMatches(db(), parseRules(row.rules as Json))
            : row.manualCount,
      };
    }),
  );
}

const isSort = (value: string): value is SortOrder =>
  (SORT_ORDERS as readonly string[]).includes(value);

export async function getCollectionForEditor(id: string): Promise<EditorCollection | null> {
  const [data] = await db().select().from(collections).where(eq(collections.id, id)).limit(1);
  if (!data) return null;

  const memberRows = await db()
    .select({
      position: collectionProducts.position,
      id: products.id,
      title: products.title,
      handle: products.handle,
    })
    .from(collectionProducts)
    .innerJoin(products, eq(products.id, collectionProducts.productId))
    .where(eq(collectionProducts.collectionId, id))
    .orderBy(asc(collectionProducts.position));
  const images = memberRows.length
    ? await db()
        .select({
          productId: productImages.productId,
          position: productImages.position,
          externalUrl: mediaAssets.externalUrl,
          storagePath: mediaAssets.storagePath,
        })
        .from(productImages)
        .innerJoin(mediaAssets, eq(mediaAssets.id, productImages.mediaId))
        .where(
          sql`${productImages.productId} in (select product_id from ${collectionProducts} where collection_id = ${id})`,
        )
    : [];

  const kind: CollectionKind = data.kind === "automatic" ? "automatic" : "manual";
  const rules = parseRules(data.rules as Json);
  return {
    id: data.id,
    title: data.title,
    handle: data.handle,
    description: data.description ?? "",
    kind,
    rules,
    sortOrder: isSort(data.sortOrder) ? data.sortOrder : "manual",
    published: data.status === "published",
    imageId: data.imageId ?? "",
    seoTitle: data.seoTitle ?? "",
    seoDescription: data.seoDescription ?? "",
    members: memberRows.map((row) => {
      const image = images
        .filter((i) => i.productId === row.id)
        .sort((a, b) => a.position - b.position)[0];
      return {
        id: row.id,
        title: row.title,
        handle: row.handle,
        thumbnail: image ? mediaUrl(image) || null : null,
      };
    }),
    matchCount: kind === "automatic" ? await countRuleMatches(db(), rules) : 0,
    version: data.updatedAt.toISOString(),
  };
}

/** Categories flattened in tree order, with their depth for indentation. */
export async function listCategoryTree(): Promise<CategoryNode[]> {
  const rows = await db()
    .select()
    .from(categories)
    .orderBy(asc(categories.position), asc(categories.name));
  const byParent = new Map<string | null, typeof rows>();
  for (const row of rows) {
    // An orphan (parent missing) is shown at the top level.
    const parent = row.parentId && rows.some((r) => r.id === row.parentId) ? row.parentId : null;
    byParent.set(parent, [...(byParent.get(parent) ?? []), row]);
  }
  const out: CategoryNode[] = [];
  const visit = (parent: string | null, depth: number, seen: Set<string>) => {
    for (const row of byParent.get(parent) ?? []) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      out.push({ id: row.id, name: row.name, handle: row.handle, parentId: row.parentId, depth });
      visit(row.id, depth + 1, seen);
    }
  };
  visit(null, 0, new Set());
  return out;
}
