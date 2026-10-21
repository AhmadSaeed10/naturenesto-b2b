// Server only: the storefront shows active, not deleted products only.
import { cacheLife, cacheTag } from "next/cache";
import { catalogCategories } from "@/content/catalog";
import { sampleProducts } from "@/content/sample-products";
import type { CatalogSlug, Product, ProductBadge } from "@/content/types";
import { mediaUrl } from "@/lib/media";
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/lib/db";
import { mediaAssets, productImages, products, productVariants } from "@/lib/db/schema";

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

async function fetchFromDatabase(slug: CatalogSlug): Promise<Product[] | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    const rows = await db()
      .select({
        id: products.id,
        handle: products.handle,
        title: products.title,
        tags: products.tags,
      })
      .from(products)
      .where(
        and(
          eq(products.status, "active"),
          isNull(products.deletedAt),
          sql`${products.tags} @> ARRAY[${slug}]::text[]`,
        ),
      )
      .orderBy(asc(products.title));
    if (rows.length === 0) return [];
    const ids = rows.map((row) => row.id);

    const [variantRows, imageRows] = await Promise.all([
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
    ]);

    return rows.flatMap((row): Product[] => {
      const variants = variantRows.filter((v) => v.productId === row.id).sort(byPosition);
      const variant = variants[0];
      const image = imageRows.filter((i) => i.productId === row.id).sort(byPosition)[0];
      if (!variant || !image) return [];
      const inStock = variants.some((v) => !v.trackInventory || v.allowBackorder || v.stock > 0);
      return [
        {
          id: row.handle,
          name: row.title,
          price: variant.price / PAISA_PER_RUPEE,
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
export async function getCatalog(slug: CatalogSlug): Promise<CatalogResult> {
  "use cache";
  cacheLife("hours");
  cacheTag("products", `products:${slug}`);

  const live = await fetchFromDatabase(slug);
  if (live && live.length > 0) return { products: live, source: "database" };

  return {
    products: sampleProducts.filter((product) => product.categories.includes(slug)),
    source: "sample",
  };
}
