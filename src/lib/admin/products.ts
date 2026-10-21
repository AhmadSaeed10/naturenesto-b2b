import "server-only";
import { mediaUrl } from "@/lib/media";
import {
  type SQL,
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  or,
  sql,
} from "drizzle-orm";
import { db } from "@/lib/db";
import type { Enums, Json } from "@/lib/db/enums";
import {
  categories,
  collectionProducts,
  collections,
  mediaAssets,
  productCategories,
  productImages,
  productOptions,
  products,
  productVariants,
} from "@/lib/db/schema";
import { cleanSearch } from "./media";
import { type ProductInput, descriptionText } from "./product-schema";
import { type MediaPickerOption, type PickerOption, parseRules } from "./products-shared";

export {
  type CollectionRule,
  type MediaPickerOption,
  type PickerOption,
  parseRules,
} from "./products-shared";

export type ProductStatus = Enums<"product_status">;
export type StatusFilter = ProductStatus | "all" | "deleted";
export const PRODUCT_PAGE_SIZE = 50;

export interface ProductRow {
  id: string;
  title: string;
  handle: string;
  status: ProductStatus;
  productType: string | null;
  deleted: boolean;
  thumbnail: string | null;
  stock: number;
  variantCount: number;
  tracked: boolean;
}

export interface ProductList {
  rows: ProductRow[];
  total: number;
  page: number;
  pageCount: number;
}

interface ListOptions {
  query: string;
  status: StatusFilter;
  collectionId: string;
  page: number;
}

export async function listProducts({
  query,
  status,
  collectionId,
  page,
}: ListOptions): Promise<ProductList> {
  const from = (page - 1) * PRODUCT_PAGE_SIZE;
  const conditions: SQL[] = [
    status === "deleted" ? isNotNull(products.deletedAt) : isNull(products.deletedAt),
  ];
  if (status !== "all" && status !== "deleted") conditions.push(eq(products.status, status));

  const term = cleanSearch(query);
  if (term) {
    // SKUs live on variants, so a product matches when any of its variants does.
    conditions.push(
      or(
        ilike(products.title, `%${term}%`),
        ilike(products.handle, `%${term}%`),
        sql`exists (select 1 from ${productVariants} v where v.product_id = ${products.id} and v.sku ilike ${`%${term}%`})`,
      ) as SQL,
    );
  }

  if (collectionId) {
    const [collection] = await db()
      .select({ id: collections.id, kind: collections.kind, rules: collections.rules })
      .from(collections)
      .where(eq(collections.id, collectionId))
      .limit(1);
    if (collection?.kind === "manual") {
      // An empty manual collection matches nothing.
      conditions.push(
        sql`${products.id} in (select product_id from ${collectionProducts} where collection_id = ${collection.id})`,
      );
    } else if (collection) {
      for (const rule of parseRules(collection.rules as Json)) {
        conditions.push(
          rule.field === "tag"
            ? sql`${products.tags} @> ARRAY[${rule.value}]::text[]`
            : eq(rule.field === "vendor" ? products.vendor : products.productType, rule.value),
        );
      }
    }
  }
  const where = and(...conditions);

  const [data, [counted]] = await Promise.all([
    db()
      .select({
        id: products.id,
        title: products.title,
        handle: products.handle,
        status: products.status,
        productType: products.productType,
        deletedAt: products.deletedAt,
      })
      .from(products)
      .where(where)
      .orderBy(desc(products.updatedAt))
      .limit(PRODUCT_PAGE_SIZE)
      .offset(from),
    db()
      .select({ n: sql<number>`count(*)::int` })
      .from(products)
      .where(where),
  ]);

  const ids = data.map((row) => row.id);
  const [variantRows, imageRows] = ids.length
    ? await Promise.all([
        db()
          .select({
            productId: productVariants.productId,
            stock: productVariants.stock,
            trackInventory: productVariants.trackInventory,
          })
          .from(productVariants)
          .where(inArray(productVariants.productId, ids)),
        db()
          .select({
            productId: productImages.productId,
            position: productImages.position,
            externalUrl: mediaAssets.externalUrl,
            storagePath: mediaAssets.storagePath,
          })
          .from(productImages)
          .innerJoin(mediaAssets, eq(mediaAssets.id, productImages.mediaId))
          .where(inArray(productImages.productId, ids)),
      ])
    : [[], []];

  const total = counted?.n ?? 0;
  return {
    rows: data.map((row) => {
      const image = imageRows
        .filter((i) => i.productId === row.id)
        .sort((a, b) => a.position - b.position)[0];
      const variants = variantRows.filter((v) => v.productId === row.id);
      const tracked = variants.filter((variant) => variant.trackInventory);
      return {
        id: row.id,
        title: row.title,
        handle: row.handle,
        status: row.status,
        productType: row.productType,
        deleted: row.deletedAt !== null,
        thumbnail: image ? mediaUrl(image) || null : null,
        stock: tracked.reduce((sum, variant) => sum + variant.stock, 0),
        variantCount: variants.length,
        tracked: tracked.length > 0,
      };
    }),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PRODUCT_PAGE_SIZE)),
  };
}

export interface EditorVariant {
  id: string | null;
  title: string;
  sku: string;
  price: number;
  compare_at_price: number | null;
  cost: number | null;
  weight_g: number | null;
  option_values: Record<string, string>;
  track_inventory: boolean;
  allow_backorder: boolean;
  low_stock_threshold: number;
  initial_stock: number;
  /** Current stock, shown read only for saved variants. */
  stock: number;
}

export interface EditorImage {
  media_id: string;
  alt: string;
  url: string;
  label: string;
}

export type EditorProduct = Omit<ProductInput, "variants" | "images"> & {
  variants: EditorVariant[];
  images: EditorImage[];
  /** Changes on every save; the editor remounts from fresh data when it does. */
  version: string;
};

const asStringRecord = (value: Json): Record<string, string> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? Object.fromEntries(
        Object.entries(value).filter(
          (entry): entry is [string, string] => typeof entry[1] === "string",
        ),
      )
    : {};

export async function getProductForEditor(id: string): Promise<EditorProduct | null> {
  const [data] = await db().select().from(products).where(eq(products.id, id)).limit(1);
  if (!data) return null;

  const [optionRows, variantRows, imageRows, collectionRows, categoryRows] = await Promise.all([
    db()
      .select()
      .from(productOptions)
      .where(eq(productOptions.productId, id))
      .orderBy(asc(productOptions.position)),
    db()
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, id))
      .orderBy(asc(productVariants.position)),
    db()
      .select({
        mediaId: productImages.mediaId,
        alt: productImages.alt,
        externalUrl: mediaAssets.externalUrl,
        storagePath: mediaAssets.storagePath,
        title: mediaAssets.title,
        mediaAlt: mediaAssets.alt,
      })
      .from(productImages)
      .innerJoin(mediaAssets, eq(mediaAssets.id, productImages.mediaId))
      .where(eq(productImages.productId, id))
      .orderBy(asc(productImages.position)),
    db()
      .select({ id: collectionProducts.collectionId })
      .from(collectionProducts)
      .where(eq(collectionProducts.productId, id)),
    db()
      .select({ id: productCategories.categoryId })
      .from(productCategories)
      .where(eq(productCategories.productId, id)),
  ]);

  return {
    id: data.id,
    title: data.title,
    handle: data.handle,
    description: descriptionText(data.description as Json),
    status: data.status,
    vendor: data.vendor ?? "",
    product_type: data.productType ?? "",
    tags: data.tags,
    seo_title: data.seoTitle ?? "",
    seo_description: data.seoDescription ?? "",
    options: optionRows.map((option) => ({ name: option.name, values: option.values })),
    variants: variantRows.map((variant) => ({
      id: variant.id,
      title: variant.title,
      sku: variant.sku ?? "",
      price: variant.price,
      compare_at_price: variant.compareAtPrice,
      cost: variant.cost,
      weight_g: variant.weightG,
      option_values: asStringRecord(variant.optionValues as Json),
      track_inventory: variant.trackInventory,
      allow_backorder: variant.allowBackorder,
      low_stock_threshold: variant.lowStockThreshold,
      initial_stock: 0,
      stock: variant.stock,
    })),
    images: imageRows.map((image) => ({
      media_id: image.mediaId,
      alt: image.alt ?? "",
      url: mediaUrl(image),
      label: image.title || image.mediaAlt || "",
    })),
    collection_ids: collectionRows.map((row) => row.id),
    category_ids: categoryRows.map((row) => row.id),
    version: data.updatedAt.toISOString(),
  };
}

/** Collections, categories and images the editor lets you pick from. */
export async function getEditorOptions(): Promise<{
  manualCollections: PickerOption[];
  categories: PickerOption[];
  media: MediaPickerOption[];
}> {
  const [collectionRows, categoryRows, mediaRows] = await Promise.all([
    db()
      .select({ id: collections.id, title: collections.title })
      .from(collections)
      .where(eq(collections.kind, "manual"))
      .orderBy(asc(collections.title)),
    db()
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .orderBy(asc(categories.position), asc(categories.name)),
    db().select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt)).limit(300),
  ]);
  return {
    manualCollections: collectionRows.map((row) => ({ id: row.id, label: row.title })),
    categories: categoryRows.map((row) => ({ id: row.id, label: row.name })),
    media: mediaRows.map((row) => ({
      id: row.id,
      label: row.title || row.alt || row.externalUrl || row.storagePath || row.id,
      url: mediaUrl(row),
    })),
  };
}

export async function listCollectionOptions(): Promise<PickerOption[]> {
  const rows = await db()
    .select({ id: collections.id, title: collections.title })
    .from(collections)
    .orderBy(asc(collections.position), asc(collections.title));
  return rows.map((row) => ({ id: row.id, label: row.title }));
}
