import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { descriptionText } from "@/lib/admin/product-schema";
import { richTextSource } from "@/lib/cms/rich-text";
import { mediaUrl } from "@/lib/media";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/lib/db";
import type { Json } from "@/lib/db/enums";
import {
  mediaAssets,
  productImages,
  productOptions,
  products,
  productVariants,
} from "@/lib/db/schema";

export interface StoreVariant {
  id: string;
  title: string;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  optionValues: Record<string, string>;
  /** Whether it can be added to the cart now. */
  available: boolean;
  /** Units left when stock is tracked and low, for the "only n left" hint. */
  lowStock: number | null;
}

export interface StoreProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  productType: string | null;
  vendor: string | null;
  tags: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  options: { name: string; values: string[] }[];
  variants: StoreVariant[];
  images: { src: string; alt: string }[];
}

const asRecord = (value: Json): Record<string, string> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? Object.fromEntries(
        Object.entries(value).filter((e): e is [string, string] => typeof e[1] === "string"),
      )
    : {};

/** An active product for its page. Drafts and deleted products are never returned. */
export async function getProduct(handle: string): Promise<StoreProduct | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("products", `product:${handle}`);
  if (!isDatabaseConfigured()) return null;
  const [data] = await db()
    .select()
    .from(products)
    .where(
      and(eq(products.handle, handle), eq(products.status, "active"), isNull(products.deletedAt)),
    )
    .limit(1);
  if (!data) return null;

  const [optionRows, variantRows, imageRows] = await Promise.all([
    db()
      .select()
      .from(productOptions)
      .where(eq(productOptions.productId, data.id))
      .orderBy(asc(productOptions.position)),
    db()
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, data.id))
      .orderBy(asc(productVariants.position)),
    db()
      .select({
        alt: productImages.alt,
        externalUrl: mediaAssets.externalUrl,
        storagePath: mediaAssets.storagePath,
        mediaAlt: mediaAssets.alt,
        decorative: mediaAssets.decorative,
      })
      .from(productImages)
      .innerJoin(mediaAssets, eq(mediaAssets.id, productImages.mediaId))
      .where(eq(productImages.productId, data.id))
      .orderBy(asc(productImages.position)),
  ]);

  return {
    id: data.id,
    handle: data.handle,
    title: data.title,
    // Descriptions are plain text today; rich text is read the same way when it arrives.
    description:
      richTextSource(data.description as Json) || descriptionText(data.description as Json),
    productType: data.productType,
    vendor: data.vendor,
    tags: data.tags,
    seoTitle: data.seoTitle,
    seoDescription: data.seoDescription,
    options: optionRows.map(({ name, values }) => ({ name, values })),
    variants: variantRows.map((v) => {
      const available = !v.trackInventory || v.allowBackorder || v.stock > 0;
      return {
        id: v.id,
        title: v.title,
        sku: v.sku,
        price: v.price,
        compareAtPrice: v.compareAtPrice,
        optionValues: asRecord(v.optionValues as Json),
        available,
        lowStock:
          v.trackInventory && !v.allowBackorder && v.stock > 0 && v.stock <= v.lowStockThreshold
            ? v.stock
            : null,
      };
    }),
    images: imageRows.map((image) => ({
      src: mediaUrl(image),
      alt: image.decorative ? "" : (image.alt ?? image.mediaAlt),
    })),
  };
}

/** Active product handles, for build time params. */
export async function listProductHandles(): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  if (!isDatabaseConfigured()) return [];
  const rows = await db()
    .select({ handle: products.handle })
    .from(products)
    .where(and(eq(products.status, "active"), isNull(products.deletedAt)))
    .limit(500);
  return rows.map((row) => row.handle);
}
