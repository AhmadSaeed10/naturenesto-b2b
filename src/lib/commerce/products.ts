import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { catalogCategories } from "@/content/catalog";
import { sampleCare } from "@/content/sample-care";
import { sampleProducts } from "@/content/sample-products";
import type { CatalogSlug, ProductBadge } from "@/content/types";
import { descriptionText } from "@/lib/admin/product-schema";
import { type Care, EMPTY_CARE, parseCare } from "@/lib/care";
import { richTextSource } from "@/lib/cms/rich-text";
import { mediaUrl } from "@/lib/media";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/lib/db";
import type { Json } from "@/lib/db/enums";
import { goneLive } from "@/lib/db/visibility";
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
  barcode: string | null;
  /** Photo to show when this variant is picked; one of the product images. */
  imageSrc: string | null;
}

export interface StoreProduct {
  /** "sample" products come from the code catalogue: read-only, enquiry instead of the cart. */
  source: "database" | "sample";
  id: string;
  handle: string;
  title: string;
  description: string;
  shortDescription: string;
  specs: { label: string; value: string }[];
  included: string[];
  /** Handles picked by hand in the admin, shown first under "Goes well with". */
  relatedHandles: string[];
  productType: string | null;
  vendor: string | null;
  tags: string[];
  categories: CatalogSlug[];
  badges: ProductBadge[];
  care: Care;
  seoTitle: string | null;
  seoDescription: string | null;
  options: { name: string; values: string[] }[];
  variants: StoreVariant[];
  images: { src: string; alt: string }[];
}

const SLUGS: readonly string[] = catalogCategories.map((category) => category.slug);
const BADGES: readonly string[] = ["new", "pet-safe", "low-light", "easy-care", "bestseller"];
const BADGE_PREFIX = "badge:";
const PAISA_PER_RUPEE = 100;

const isSlug = (tag: string): tag is CatalogSlug => SLUGS.includes(tag);
const isBadge = (value: string): value is ProductBadge => BADGES.includes(value);

const asRecord = (value: Json): Record<string, string> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? Object.fromEntries(
        Object.entries(value).filter((e): e is [string, string] => typeof e[1] === "string"),
      )
    : {};

const asSpecs = (value: Json): { label: string; value: string }[] =>
  Array.isArray(value)
    ? value.flatMap((row) =>
        row &&
        typeof row === "object" &&
        !Array.isArray(row) &&
        typeof row.label === "string" &&
        typeof row.value === "string"
          ? [{ label: row.label, value: row.value }]
          : [],
      )
    : [];

/**
 * An active product for its page. Drafts and deleted products are never returned. A handle
 * with no live product falls back to the sample catalogue, the same fallback the category
 * pages use, so a sample card always opens a page.
 */
export async function getProduct(handle: string): Promise<StoreProduct | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("products", `product:${handle}`);
  return (await getLiveProduct(handle)) ?? sampleStoreProduct(handle);
}

function sampleStoreProduct(handle: string): StoreProduct | null {
  const sample = sampleProducts.find((product) => product.id === handle);
  if (!sample) return null;
  return {
    source: "sample",
    id: `sample:${sample.id}`,
    handle: sample.id,
    title: sample.name,
    description: "",
    shortDescription: "",
    specs: [],
    included: [],
    relatedHandles: [],
    productType: null,
    vendor: null,
    tags: [],
    categories: sample.categories,
    badges: sample.badges ?? [],
    care: { ...EMPTY_CARE, ...sampleCare[sample.id], size: sample.size ?? "" },
    seoTitle: null,
    seoDescription: null,
    options: [],
    variants: [
      {
        id: `sample:${sample.id}`,
        title: "Default",
        sku: null,
        price: Math.round(sample.price * PAISA_PER_RUPEE),
        compareAtPrice: sample.compareAtPrice
          ? Math.round(sample.compareAtPrice * PAISA_PER_RUPEE)
          : null,
        optionValues: {},
        available: sample.inStock,
        lowStock: null,
        barcode: null,
        imageSrc: null,
      },
    ],
    images: [{ src: sample.image.src, alt: sample.name }],
  };
}

async function getLiveProduct(handle: string): Promise<StoreProduct | null> {
  if (!isDatabaseConfigured()) return null;
  const [data] = await db()
    .select()
    .from(products)
    .where(
      and(
        eq(products.handle, handle),
        eq(products.status, "active"),
        goneLive(products.publishAt),
        isNull(products.deletedAt),
      ),
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
        mediaId: productImages.mediaId,
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

  const srcByMedia = new Map(imageRows.map((image) => [image.mediaId, mediaUrl(image)]));

  return {
    source: "database",
    id: data.id,
    handle: data.handle,
    title: data.title,
    // Stored as markdown (older rows as plain text); the page renders both the same way.
    description:
      richTextSource(data.description as Json) || descriptionText(data.description as Json),
    shortDescription: data.shortDescription ?? "",
    specs: asSpecs(data.specs as Json),
    included: data.included,
    relatedHandles: data.relatedHandles,
    productType: data.productType,
    vendor: data.vendor,
    tags: data.tags,
    categories: data.tags.filter(isSlug),
    badges: data.tags
      .filter((tag) => tag.startsWith(BADGE_PREFIX))
      .map((tag) => tag.slice(BADGE_PREFIX.length))
      .filter(isBadge),
    care: parseCare(data.care),
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
        barcode: v.barcode,
        imageSrc: v.imageMediaId ? (srcByMedia.get(v.imageMediaId) ?? null) : null,
      };
    }),
    images: imageRows.map((image) => ({
      src: mediaUrl(image),
      alt: image.decorative ? "" : (image.alt ?? image.mediaAlt),
    })),
  };
}

/** Active product handles plus the sample ones, for build time params. */
export async function listProductHandles(): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  const samples = sampleProducts.map((product) => product.id);
  if (!isDatabaseConfigured()) return samples;
  const rows = await db()
    .select({ handle: products.handle })
    .from(products)
    .where(
      and(eq(products.status, "active"), goneLive(products.publishAt), isNull(products.deletedAt)),
    )
    .limit(500);
  return [...new Set([...rows.map((row) => row.handle), ...samples])];
}
