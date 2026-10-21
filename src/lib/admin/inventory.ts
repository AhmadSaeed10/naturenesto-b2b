import "server-only";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import type { Enums } from "@/lib/db/enums";
import { inventoryAdjustments, products, productVariants } from "@/lib/db/schema";
import { cleanSearch } from "./media";

export type StockFilter = "all" | "low" | "out";
export const INVENTORY_PAGE_SIZE = 50;

export interface InventoryRow {
  variantId: string;
  productId: string;
  productTitle: string;
  variantTitle: string;
  sku: string | null;
  stock: number;
  threshold: number;
  level: "ok" | "low" | "out";
}

export interface InventoryPage {
  rows: InventoryRow[];
  page: number;
  pageCount: number;
}

/**
 * Tracked variants of live products. Low stock compares each variant with its own
 * threshold, so filtering happens after the fetch; the catalogue is small enough for that.
 */
export async function listInventory({
  query,
  filter,
  page,
}: {
  query: string;
  filter: StockFilter;
  page: number;
}): Promise<InventoryPage> {
  const data = await db()
    .select({
      id: productVariants.id,
      title: productVariants.title,
      sku: productVariants.sku,
      stock: productVariants.stock,
      threshold: productVariants.lowStockThreshold,
      productId: products.id,
      productTitle: products.title,
      productHandle: products.handle,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(and(eq(productVariants.trackInventory, true), isNull(products.deletedAt)))
    .orderBy(productVariants.stock)
    .limit(2000);

  // Search covers product title, handle, variant title and SKU in one pass.
  const term = cleanSearch(query).toLowerCase();
  const rows = data
    .map((row): InventoryRow & { search: string } => {
      const level = row.stock <= 0 ? "out" : row.stock <= row.threshold ? "low" : "ok";
      return {
        variantId: row.id,
        productId: row.productId,
        productTitle: row.productTitle,
        variantTitle: row.title,
        sku: row.sku,
        stock: row.stock,
        threshold: row.threshold,
        level,
        search: [row.productTitle, row.productHandle, row.title, row.sku].join(" ").toLowerCase(),
      };
    })
    .filter(
      (row) => filter === "all" || (filter === "out" ? row.level === "out" : row.level !== "ok"),
    )
    .filter((row) => !term || row.search.includes(term));

  const pageCount = Math.max(1, Math.ceil(rows.length / INVENTORY_PAGE_SIZE));
  const from = (page - 1) * INVENTORY_PAGE_SIZE;
  return {
    rows: rows.slice(from, from + INVENTORY_PAGE_SIZE).map(({ search: _search, ...row }) => row),
    page,
    pageCount,
  };
}

export interface StockSummary {
  active: number;
  drafts: number;
  low: number;
  out: number;
}

export async function stockSummary(): Promise<StockSummary> {
  const [[active], [drafts], rows] = await Promise.all([
    db()
      .select({ n: count() })
      .from(products)
      .where(and(eq(products.status, "active"), isNull(products.deletedAt))),
    db()
      .select({ n: count() })
      .from(products)
      .where(and(eq(products.status, "draft"), isNull(products.deletedAt))),
    db()
      .select({ stock: productVariants.stock, threshold: productVariants.lowStockThreshold })
      .from(productVariants)
      .innerJoin(products, eq(products.id, productVariants.productId))
      .where(
        and(
          eq(productVariants.trackInventory, true),
          eq(products.status, "active"),
          isNull(products.deletedAt),
        ),
      ),
  ]);
  return {
    active: active?.n ?? 0,
    drafts: drafts?.n ?? 0,
    low: rows.filter((row) => row.stock > 0 && row.stock <= row.threshold).length,
    out: rows.filter((row) => row.stock <= 0).length,
  };
}

export interface AdjustmentLine {
  id: string;
  label: string;
  delta: number;
  after: number;
  reason: Enums<"stock_reason">;
  note: string | null;
  at: string;
}

export async function recentAdjustments(limit = 20): Promise<AdjustmentLine[]> {
  const rows = await db()
    .select({
      id: inventoryAdjustments.id,
      delta: inventoryAdjustments.delta,
      stockAfter: inventoryAdjustments.stockAfter,
      reason: inventoryAdjustments.reason,
      note: inventoryAdjustments.note,
      createdAt: inventoryAdjustments.createdAt,
      variantTitle: productVariants.title,
      productTitle: products.title,
    })
    .from(inventoryAdjustments)
    .leftJoin(productVariants, eq(productVariants.id, inventoryAdjustments.variantId))
    .leftJoin(products, eq(products.id, productVariants.productId))
    .orderBy(desc(inventoryAdjustments.createdAt))
    .limit(limit);
  return rows.map((row) => ({
    id: row.id,
    label: [row.productTitle, row.variantTitle].filter(Boolean).join(" · "),
    delta: row.delta,
    after: row.stockAfter,
    reason: row.reason,
    note: row.note,
    at: row.createdAt.toISOString(),
  }));
}
