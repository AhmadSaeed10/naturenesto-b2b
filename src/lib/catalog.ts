// Server only: the storefront shows active, not deleted products only.
import { cacheLife, cacheTag } from "next/cache";
import { catalogCategories } from "@/content/catalog";
import { sampleProducts } from "@/content/sample-products";
import type { CatalogSlug, Product, ProductBadge } from "@/content/types";
import { parseCare } from "@/lib/care";
import { mediaUrl } from "@/lib/media";
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/lib/db";
import {
  mediaAssets,
  productImages,
  productReviews,
  products,
  productVariants,
} from "@/lib/db/schema";
import { goneLive } from "@/lib/db/visibility";

export type CatalogSource = "database" | "sample";

export interface CatalogResult {
  products: Product[];
  source: CatalogSource;
}

const BADGES: readonly ProductBadge[] = ["new", "pet-safe", "low-light", "easy-care", "bestseller"];
const SLUGS: readonly string[] = catalogCategories.map((category) => category.slug);
// Badges are stored as "badge:<name>" tags so they never collide with collection tags.
const BADGE_PREFIX = "badge:";
const DEFAULT_VARIANT = "Default";
const PAISA_PER_RUPEE = 100;

const isSlug = (tag: string): tag is CatalogSlug => SLUGS.includes(tag);
const isBadge = (value: string): value is ProductBadge =>
  (BADGES as readonly string[]).includes(value);
const byPosition = <T extends { position: number }>(a: T, b: T): number => a.position - b.position;

async function fetchFromDatabase(slug: CatalogSlug | null): Promise<Product[] | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    const rows = await db()
      .select({
        id: products.id,
        handle: products.handle,
        title: products.title,
        tags: products.tags,
        care: products.care,
      })
      .from(products)
      .where(
        and(
          eq(products.status, "active"),
          goneLive(products.publishAt),
          isNull(products.deletedAt),
          slug ? sql`${products.tags} @> ARRAY[${slug}]::text[]` : undefined,
        ),
      )
      .orderBy(asc(products.title));
    if (rows.length === 0) return [];
    const ids = rows.map((row) => row.id);

    const handles = rows.map((row) => row.handle);
    const [variantRows, imageRows, ratingRows] = await Promise.all([
      db().select().from(productVariants).where(inArray(productVariants.productId, ids)),
      db()
        .select({
          productId: productImages.productId,
          position: productImages.position,
          alt: productImages.alt,
          externalUrl: mediaAssets.externalUrl,
          storagePath: mediaAssets.storagePath,
          mediaAlt: mediaAssets.alt,
          decorative: mediaAssets.decorative,
        })
        .from(productImages)
        .innerJoin(mediaAssets, eq(mediaAssets.id, productImages.mediaId))
        .where(inArray(productImages.productId, ids)),
      db()
        .select({
          handle: productReviews.handle,
          average: sql<number>`round(avg(${productReviews.rating})::numeric, 1)::float`,
          count: sql<number>`count(*)::int`,
        })
        .from(productReviews)
        .where(and(inArray(productReviews.handle, handles), eq(productReviews.status, "published")))
        .groupBy(productReviews.handle),
    ]);
    const ratings = new Map(ratingRows.map((r) => [r.handle, r]));

    return rows.flatMap((row): Product[] => {
      const variants = variantRows.filter((v) => v.productId === row.id).sort(byPosition);
      const variant = variants[0];
      const images = imageRows.filter((i) => i.productId === row.id).sort(byPosition);
      const image = images[0];
      const hover = images[1];
      if (!variant || !image) return [];
      const inStock = variants.some((v) => !v.trackInventory || v.allowBackorder || v.stock > 0);
      const care = parseCare(row.care);
      const lows = variants.filter(
        (v) =>
          v.trackInventory && !v.allowBackorder && v.stock > 0 && v.stock <= v.lowStockThreshold,
      );
      const prices = new Set(variants.map((v) => v.price));
      return [
        {
          id: row.handle,
          care: {
            light: care.light || undefined,
            pet: care.pet || undefined,
            level: care.level || undefined,
          },
          // Only when every purchasable variant is low, so the hint is never misleading.
          lowStock:
            lows.length > 0 && lows.length === variants.filter((v) => v.stock > 0).length
              ? Math.min(...lows.map((v) => v.stock))
              : undefined,
          fromPrice: prices.size > 1,
          rating: ratings.get(row.handle)
            ? {
                average: ratings.get(row.handle)?.average ?? 0,
                count: ratings.get(row.handle)?.count ?? 0,
              }
            : undefined,
          name: row.title,
          price: Math.min(...variants.map((v) => v.price)) / PAISA_PER_RUPEE,
          compareAtPrice:
            variant.compareAtPrice === null ? undefined : variant.compareAtPrice / PAISA_PER_RUPEE,
          categories: row.tags.filter(isSlug),
          image: {
            src: mediaUrl(image),
            alt: image.decorative ? "" : (image.alt ?? image.mediaAlt),
          },
          size: variant.title === DEFAULT_VARIANT ? undefined : variant.title,
          badges: row.tags
            .filter((tag) => tag.startsWith(BADGE_PREFIX))
            .map((tag) => tag.slice(BADGE_PREFIX.length))
            .filter(isBadge),
          inStock,
          href: `/products/${row.handle}`,
          hoverImage: hover ? { src: mediaUrl(hover), alt: "" } : undefined,
          // One purchasable variant means the card can add it without a trip to the page.
          quickAddVariantId: variants.length === 1 && inStock ? variant.id : undefined,
        },
      ];
    });
  } catch (error) {
    console.warn(
      `[catalog] query failed for "${slug}"`,
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

/**
 * Products for one category. Uses the database when it is configured and returns active
 * products; otherwise falls back to the sample catalogue so pages never render empty.
 */
export async function getCatalog(slug: CatalogSlug | null): Promise<CatalogResult> {
  "use cache";
  cacheLife("hours");
  cacheTag("products", `products:${slug ?? "all"}`);

  const live = await fetchFromDatabase(slug);
  if (live && live.length > 0) return { products: live, source: "database" };

  return {
    products: slug
      ? sampleProducts.filter((product) => product.categories.includes(slug))
      : sampleProducts,
    source: "sample",
  };
}
